import { jsPDF } from 'jspdf'
import { marked, type Token, type Tokens } from 'marked'
import type { CardFace, FlipEdge, NumberPosition, SheetSize, TextAlign } from '../types'
import { SHEET_SIZES } from './cardSizes'
import { hexToRgb, type CardTheme } from './cardThemes'
import { applyCueEmphasis } from './cueEmphasis'
import { groupByCard, renderSheets, type GuideOptions, type SheetCard } from './pdfLayout'

const PT_TO_MM = 25.4 / 72
const NUMBER_PT = 9

const HEADING_SCALE: Record<number, number> = { 1: 1.6, 2: 1.35, 3: 1.18, 4: 1.05, 5: 1, 6: 1 }

export interface VectorPdfStyle {
  fontSizePt: number
  paddingMm: number
  showNumbers: boolean
  showMax: boolean
  numberPosition: NumberPosition
  totalCards: number
  lineHeight: number
  textAlign: TextAlign
  cueEmphasis: boolean
  theme: CardTheme
}

type Rgb = { r: number; g: number; b: number }

interface DrawOpts {
  lineHeight: number
  align: TextAlign
  color: Rgb
}

export interface GenerateVectorPdfParams {
  faces: CardFace[]
  cardWidthMm: number
  cardHeightMm: number
  sheetSize: SheetSize
  doubleSided: boolean
  flipEdge: FlipEdge
  guides: GuideOptions
  style: VectorPdfStyle
}

interface Run {
  text: string
  bold: boolean
  italic: boolean
  mono: boolean
}

function fontStyle(bold: boolean, italic: boolean): string {
  if (bold && italic) return 'bolditalic'
  if (bold) return 'bold'
  if (italic) return 'italic'
  return 'normal'
}

/** Flatten marked inline tokens into styled text runs. */
function inlineToRuns(tokens: Token[] | undefined, bold: boolean, italic: boolean): Run[] {
  if (!tokens) return []
  const runs: Run[] = []
  for (const t of tokens as Tokens.Generic[]) {
    switch (t.type) {
      case 'strong':
        runs.push(...inlineToRuns(t.tokens, true, italic))
        break
      case 'em':
        runs.push(...inlineToRuns(t.tokens, bold, true))
        break
      case 'del':
      case 'link':
        runs.push(...inlineToRuns(t.tokens, bold, italic))
        break
      case 'codespan':
        runs.push({ text: decode(t.text ?? ''), bold, italic, mono: true })
        break
      case 'br':
        runs.push({ text: '\n', bold, italic, mono: false })
        break
      default:
        if (t.tokens) runs.push(...inlineToRuns(t.tokens, bold, italic))
        else if (t.text) runs.push({ text: decode(t.text), bold, italic, mono: false })
    }
  }
  return runs
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/**
 * Draw styled runs with word wrapping, alignment and line height. Returns the y
 * position after the block. Stops drawing once `maxY` is exceeded so content
 * never spills onto the next card.
 */
function drawRuns(
  pdf: jsPDF,
  runs: Run[],
  startX: number,
  startY: number,
  maxW: number,
  maxY: number,
  fontPt: number,
  o: DrawOpts,
): number {
  const lineH = fontPt * PT_TO_MM * o.lineHeight
  let y = startY
  let lineIndex = 0

  interface Placed {
    text: string
    run: Run
    width: number
  }
  let line: Placed[] = []
  let lineContentW = 0

  const setFont = (r: Run) => {
    pdf.setFont(r.mono ? 'courier' : 'helvetica', fontStyle(r.bold, r.italic))
    pdf.setFontSize(fontPt)
  }
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(fontPt)
  const spaceW = pdf.getTextWidth(' ')

  const flush = (isLast: boolean) => {
    const n = line.length
    if (n === 0) {
      y += lineH
      lineIndex++
      return
    }
    if (y <= maxY) {
      const spaces = n - 1
      const naturalW = lineContentW + spaces * spaceW
      let x = startX
      let extra = 0
      if (o.align === 'center') x = startX + Math.max(0, (maxW - naturalW) / 2)
      else if (o.align === 'justify' && !isLast && spaces > 0) extra = (maxW - naturalW) / spaces
      pdf.setTextColor(o.color.r, o.color.g, o.color.b)
      for (let i = 0; i < n; i++) {
        const wd = line[i]
        setFont(wd.run)
        pdf.text(wd.text, x, y, { baseline: 'top' })
        x += wd.width + (i < spaces ? spaceW + extra : 0)
      }
    }
    y += lineH
    lineIndex++
    line = []
    lineContentW = 0
  }

  const pushWord = (word: string, run: Run) => {
    setFont(run)
    const w = pdf.getTextWidth(word)
    const tentative = lineContentW + (line.length > 0 ? spaceW : 0) + w
    if (line.length > 0 && tentative > maxW) flush(false)
    line.push({ text: word, run, width: w })
    lineContentW += w
  }

  for (const run of runs) {
    const parts = run.text.split('\n')
    parts.forEach((seg, si) => {
      if (si > 0) flush(false)
      const words = seg.split(/\s+/).filter(Boolean)
      for (const word of words) pushWord(word, run)
    })
  }
  if (line.length > 0) flush(true)
  return y
}

function drawBlocks(
  pdf: jsPDF,
  markdown: string,
  x: number,
  y: number,
  w: number,
  maxY: number,
  bodyPt: number,
  ctx: { lineHeight: number; align: TextAlign; color: Rgb; cueEmphasis: boolean },
): void {
  const tokens = marked.lexer(ctx.cueEmphasis ? applyCueEmphasis(markdown) : markdown)
  let cursorY = y
  const paraGap = bodyPt * PT_TO_MM * 0.5

  const base: DrawOpts = { lineHeight: ctx.lineHeight, align: ctx.align, color: ctx.color }
  const leftBase: DrawOpts = { lineHeight: ctx.lineHeight, align: 'left', color: ctx.color }

  for (const token of tokens) {
    if (cursorY > maxY) break
    const t = token as Tokens.Generic

    if (t.type === 'heading') {
      const pt = bodyPt * (HEADING_SCALE[(t as Tokens.Heading).depth] ?? 1)
      const runs = inlineToRuns(t.tokens, true, false)
      cursorY = drawRuns(pdf, runs, x, cursorY, w, maxY, pt, base) + paraGap * 0.6
    } else if (t.type === 'paragraph' || t.type === 'text') {
      const runs = inlineToRuns(t.tokens ?? ([{ type: 'text', text: t.text }] as Token[]), false, false)
      cursorY = drawRuns(pdf, runs, x, cursorY, w, maxY, bodyPt, base) + paraGap
    } else if (t.type === 'list') {
      const list = t as Tokens.List
      list.items.forEach((item, idx) => {
        if (cursorY > maxY) return
        const marker = list.ordered ? `${(Number(list.start) || 1) + idx}.` : '•'
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(bodyPt)
        pdf.setTextColor(ctx.color.r, ctx.color.g, ctx.color.b)
        pdf.text(marker, x, cursorY, { baseline: 'top' })
        const indent = pdf.getTextWidth(list.ordered ? '00. ' : '• ')
        const runs = inlineToRuns(item.tokens, false, false)
        cursorY = drawRuns(pdf, runs, x + indent, cursorY, w - indent, maxY, bodyPt, leftBase) + paraGap * 0.3
      })
      cursorY += paraGap * 0.5
    } else if (t.type === 'code') {
      const lines = (t.text ?? '').split('\n')
      const runs: Run[] = lines.map((l: string, i: number) => ({
        text: i === 0 ? l : '\n' + l,
        bold: false,
        italic: false,
        mono: true,
      }))
      cursorY = drawRuns(pdf, runs, x, cursorY, w, maxY, bodyPt, leftBase) + paraGap
    } else if (t.type === 'blockquote') {
      const runs = inlineToRuns(t.tokens, false, true)
      cursorY = drawRuns(pdf, runs, x + 3, cursorY, w - 3, maxY, bodyPt, leftBase) + paraGap
    } else if (t.type === 'space') {
      cursorY += paraGap
    }
  }
}

function drawNumber(
  pdf: jsPDF,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  pos: NumberPosition,
  color: Rgb,
): void {
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(NUMBER_PT)
  pdf.setTextColor(color.r, color.g, color.b)
  const tw = pdf.getTextWidth(label)
  const m = 2
  const [vert, horiz] = pos.split('-')
  let tx = x + m
  if (horiz === 'center') tx = x + (w - tw) / 2
  else if (horiz === 'right') tx = x + w - tw - m
  const ty = vert === 'top' ? y + m : y + h - NUMBER_PT * PT_TO_MM - m
  pdf.text(label, tx, ty, { baseline: 'top' })
  pdf.setTextColor(0)
}

function drawNotes(pdf: jsPDF, x: number, y: number, w: number, h: number, theme: CardTheme): void {
  const muted = hexToRgb(theme.muted)
  const lineCol = hexToRgb(theme.border ?? '#d7dadf')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(11)
  pdf.setTextColor(muted.r, muted.g, muted.b)
  pdf.text('Notes', x, y, { baseline: 'top' })
  pdf.setTextColor(0)
  pdf.setDrawColor(lineCol.r, lineCol.g, lineCol.b)
  pdf.setLineWidth(0.1)
  const lineGap = 8
  for (let ly = y + 10; ly < y + h; ly += lineGap) {
    pdf.line(x, ly, x + w, ly)
  }
}

export function buildVectorPdf(params: GenerateVectorPdfParams): jsPDF | null {
  const { faces, cardWidthMm, cardHeightMm, sheetSize, doubleSided, flipEdge, guides, style } = params
  if (faces.length === 0) return null

  const sheet = SHEET_SIZES[sheetSize]
  const pdf = new jsPDF({ unit: 'mm', format: [sheet.widthMm, sheet.heightMm], orientation: 'portrait' })

  const cards: SheetCard<CardFace>[] = doubleSided
    ? groupByCard(faces, faces)
    : faces.map((f) => ({ front: f }))

  const pad = style.paddingMm
  const fg = hexToRgb(style.theme.fg)
  const muted = hexToRgb(style.theme.muted)
  const bg = hexToRgb(style.theme.bg)
  const borderRgb = style.theme.border ? hexToRgb(style.theme.border) : null

  renderSheets({
    pdf,
    sheetSize,
    cardWidthMm,
    cardHeightMm,
    doubleSided,
    flipEdge,
    guides,
    cards,
    drawContent: (face, x, y, w, h) => {
      // Theme background + optional border.
      pdf.setFillColor(bg.r, bg.g, bg.b)
      pdf.rect(x, y, w, h, 'F')
      if (borderRgb) {
        pdf.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b)
        pdf.setLineWidth(0.2)
        pdf.rect(x, y, w, h)
      }

      const cx = x + pad
      const cy = y + pad
      const cw = w - 2 * pad
      const maxY = y + h - pad
      if (face.isNotes) {
        drawNotes(pdf, cx, cy, cw, h - 2 * pad, style.theme)
      } else {
        drawBlocks(pdf, face.markdown, cx, cy, cw, maxY, style.fontSizePt, {
          lineHeight: style.lineHeight,
          align: style.textAlign,
          color: fg,
          cueEmphasis: style.cueEmphasis,
        })
      }
      if (style.showNumbers) {
        const label = style.showMax ? `${face.cardNumber}/${style.totalCards}` : `${face.cardNumber}`
        drawNumber(pdf, label, x, y, w, h, style.numberPosition, muted)
      }
    },
  })

  return pdf
}

export function generateVectorPdf(params: GenerateVectorPdfParams): void {
  buildVectorPdf(params)?.save('cue-cards.pdf')
}

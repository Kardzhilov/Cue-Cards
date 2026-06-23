import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import type { CardFace, FlipEdge, SheetSize } from '../types'
import { SHEET_SIZES } from './cardSizes'

export interface GeneratePdfParams {
  faces: CardFace[]
  /** Capture source elements, one per face, in the same order as `faces`. */
  nodes: HTMLElement[]
  cardWidthMm: number
  cardHeightMm: number
  sheetSize: SheetSize
  doubleSided: boolean
  flipEdge: FlipEdge
}

const SHEET_MARGIN_MM = 8
const CAPTURE_SCALE = 3
const CUT_LINE_GRAY = 170

interface Grid {
  cols: number
  rows: number
  perSheet: number
  startX: number
  startY: number
}

function computeGrid(
  sheetWidthMm: number,
  sheetHeightMm: number,
  cardWidthMm: number,
  cardHeightMm: number,
): Grid {
  const usableW = sheetWidthMm - 2 * SHEET_MARGIN_MM
  const usableH = sheetHeightMm - 2 * SHEET_MARGIN_MM
  const cols = Math.max(1, Math.floor(usableW / cardWidthMm))
  const rows = Math.max(1, Math.floor(usableH / cardHeightMm))
  const startX = (sheetWidthMm - cols * cardWidthMm) / 2
  const startY = (sheetHeightMm - rows * cardHeightMm) / 2
  return { cols, rows, perSheet: cols * rows, startX, startY }
}

async function captureAll(nodes: HTMLElement[]): Promise<string[]> {
  const urls: string[] = []
  for (const node of nodes) {
    const canvas = await html2canvas(node, {
      scale: CAPTURE_SCALE,
      backgroundColor: '#ffffff',
      logging: false,
    })
    urls.push(canvas.toDataURL('image/png'))
  }
  return urls
}

function drawCard(
  pdf: jsPDF,
  dataUrl: string | null,
  xMm: number,
  yMm: number,
  cardWidthMm: number,
  cardHeightMm: number,
): void {
  if (dataUrl) {
    pdf.addImage(dataUrl, 'PNG', xMm, yMm, cardWidthMm, cardHeightMm)
  }
  pdf.setDrawColor(CUT_LINE_GRAY)
  pdf.setLineWidth(0.1)
  pdf.rect(xMm, yMm, cardWidthMm, cardHeightMm)
}

export async function generatePdf(params: GeneratePdfParams): Promise<void> {
  const { faces, nodes, cardWidthMm, cardHeightMm, sheetSize, doubleSided, flipEdge } = params
  if (faces.length === 0) return

  const sheet = SHEET_SIZES[sheetSize]
  const grid = computeGrid(sheet.widthMm, sheet.heightMm, cardWidthMm, cardHeightMm)
  const urls = await captureAll(nodes)

  const pdf = new jsPDF({ unit: 'mm', format: [sheet.widthMm, sheet.heightMm], orientation: 'portrait' })
  let firstPage = true

  const newPage = () => {
    if (firstPage) {
      firstPage = false
    } else {
      pdf.addPage([sheet.widthMm, sheet.heightMm], 'portrait')
    }
  }

  const cellXY = (slot: number) => {
    const col = slot % grid.cols
    const row = Math.floor(slot / grid.cols)
    return {
      x: grid.startX + col * cardWidthMm,
      y: grid.startY + row * cardHeightMm,
      col,
      row,
    }
  }

  if (!doubleSided) {
    for (let i = 0; i < urls.length; i += grid.perSheet) {
      newPage()
      const pageUrls = urls.slice(i, i + grid.perSheet)
      pageUrls.forEach((url, slot) => {
        const { x, y } = cellXY(slot)
        drawCard(pdf, url, x, y, cardWidthMm, cardHeightMm)
      })
    }
    pdf.save('cue-cards.pdf')
    return
  }

  // Double-sided: pair faces into physical cards by number.
  const cards = new Map<number, { front?: string; back?: string }>()
  faces.forEach((face, i) => {
    const entry = cards.get(face.cardNumber) ?? {}
    if (face.side === 'front') entry.front = urls[i]
    else entry.back = urls[i]
    cards.set(face.cardNumber, entry)
  })
  const ordered = [...cards.keys()].sort((a, b) => a - b).map((n) => cards.get(n)!)

  for (let i = 0; i < ordered.length; i += grid.perSheet) {
    const sheetCards = ordered.slice(i, i + grid.perSheet)

    // Front page.
    newPage()
    sheetCards.forEach((card, slot) => {
      const { x, y } = cellXY(slot)
      drawCard(pdf, card.front ?? null, x, y, cardWidthMm, cardHeightMm)
    })

    // Back page, mirrored so it aligns after duplex flipping.
    newPage()
    sheetCards.forEach((card, slot) => {
      const { col, row } = cellXY(slot)
      const mirroredCol = flipEdge === 'long' ? grid.cols - 1 - col : col
      const mirroredRow = flipEdge === 'short' ? grid.rows - 1 - row : row
      const x = grid.startX + mirroredCol * cardWidthMm
      const y = grid.startY + mirroredRow * cardHeightMm
      drawCard(pdf, card.back ?? null, x, y, cardWidthMm, cardHeightMm)
    })
  }

  pdf.save('cue-cards.pdf')
}

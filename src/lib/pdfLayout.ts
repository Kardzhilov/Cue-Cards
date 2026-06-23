import type { jsPDF } from 'jspdf'
import type { FlipEdge, SheetSize } from '../types'
import { SHEET_SIZES } from './cardSizes'

export const SHEET_MARGIN_MM = 8
const CUT_LINE_GRAY = 170
const GUIDE_GRAY = 200
const CROP_MARK_LEN_MM = 3
const CROP_MARK_GAP_MM = 1

export interface GuideOptions {
  bleedMm: number
  showSafeArea: boolean
  safeMarginMm: number
  showCropMarks: boolean
}

export interface Grid {
  cols: number
  rows: number
  perSheet: number
  startX: number
  startY: number
}

export function computeGrid(
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

/** Draw the cut rectangle plus any enabled guides around one card. */
export function drawGuides(
  pdf: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  guides: GuideOptions,
): void {
  // Trim / cut rectangle.
  pdf.setDrawColor(CUT_LINE_GRAY)
  pdf.setLineWidth(0.1)
  pdf.rect(x, y, w, h)

  if (guides.bleedMm > 0) {
    pdf.setDrawColor(GUIDE_GRAY)
    pdf.setLineDashPattern([0.6, 0.6], 0)
    pdf.rect(x - guides.bleedMm, y - guides.bleedMm, w + 2 * guides.bleedMm, h + 2 * guides.bleedMm)
    pdf.setLineDashPattern([], 0)
  }

  if (guides.showSafeArea && guides.safeMarginMm > 0) {
    const m = guides.safeMarginMm
    pdf.setDrawColor(GUIDE_GRAY)
    pdf.setLineDashPattern([0.8, 0.8], 0)
    pdf.rect(x + m, y + m, w - 2 * m, h - 2 * m)
    pdf.setLineDashPattern([], 0)
  }

  if (guides.showCropMarks) {
    pdf.setDrawColor(80)
    pdf.setLineWidth(0.15)
    const g = CROP_MARK_GAP_MM
    const l = CROP_MARK_LEN_MM
    const corners: [number, number, number][] = [
      [x, y, -1],
      [x + w, y, 1],
      [x, y + h, -1],
      [x + w, y + h, 1],
    ]
    for (const [cx, cy, dir] of corners) {
      const top = cy === y
      const vy = top ? cy - g : cy + g
      const vy2 = top ? vy - l : vy + l
      const hx = cx + dir * g
      const hx2 = cx + dir * (g + l)
      pdf.line(cx, vy, cx, vy2) // vertical mark
      pdf.line(hx, cy, hx2, cy) // horizontal mark
    }
  }
}

export interface SheetCard<T> {
  front?: T
  back?: T
}

export interface RenderSheetsParams<T> {
  pdf: jsPDF
  sheetSize: SheetSize
  cardWidthMm: number
  cardHeightMm: number
  doubleSided: boolean
  flipEdge: FlipEdge
  guides: GuideOptions
  cards: SheetCard<T>[]
  /** Draw a single face's content within the given card box. */
  drawContent: (item: T, xMm: number, yMm: number, wMm: number, hMm: number) => void
}

/**
 * Paginate physical cards onto sheets, drawing fronts (and, when double-sided,
 * mirrored backs on interleaved pages) with cut lines and guides.
 */
export function renderSheets<T>(p: RenderSheetsParams<T>): void {
  const sheet = SHEET_SIZES[p.sheetSize]
  const grid = computeGrid(sheet.widthMm, sheet.heightMm, p.cardWidthMm, p.cardHeightMm)
  let firstPage = true

  const newPage = () => {
    if (firstPage) firstPage = false
    else p.pdf.addPage([sheet.widthMm, sheet.heightMm], 'portrait')
  }

  const cell = (slot: number) => {
    const col = slot % grid.cols
    const row = Math.floor(slot / grid.cols)
    return { col, row, x: grid.startX + col * p.cardWidthMm, y: grid.startY + row * p.cardHeightMm }
  }

  for (let i = 0; i < p.cards.length; i += grid.perSheet) {
    const sheetCards = p.cards.slice(i, i + grid.perSheet)

    // Front page.
    newPage()
    sheetCards.forEach((card, slot) => {
      const { x, y } = cell(slot)
      drawGuides(p.pdf, x, y, p.cardWidthMm, p.cardHeightMm, p.guides)
      if (card.front !== undefined) {
        p.drawContent(card.front, x, y, p.cardWidthMm, p.cardHeightMm)
      }
    })

    if (!p.doubleSided) continue

    // Back page, mirrored so it aligns after duplex flipping.
    newPage()
    sheetCards.forEach((card, slot) => {
      const { col, row } = cell(slot)
      const mCol = p.flipEdge === 'long' ? grid.cols - 1 - col : col
      const mRow = p.flipEdge === 'short' ? grid.rows - 1 - row : row
      const x = grid.startX + mCol * p.cardWidthMm
      const y = grid.startY + mRow * p.cardHeightMm
      drawGuides(p.pdf, x, y, p.cardWidthMm, p.cardHeightMm, p.guides)
      if (card.back !== undefined) {
        p.drawContent(card.back, x, y, p.cardWidthMm, p.cardHeightMm)
      }
    })
  }
}

/** Group faces (front/back per card number) into ordered physical cards. */
export function groupByCard<T>(
  faces: { cardNumber: number; side: 'front' | 'back' }[],
  values: T[],
): SheetCard<T>[] {
  const map = new Map<number, SheetCard<T>>()
  faces.forEach((face, i) => {
    const entry = map.get(face.cardNumber) ?? {}
    if (face.side === 'front') entry.front = values[i]
    else entry.back = values[i]
    map.set(face.cardNumber, entry)
  })
  return [...map.keys()].sort((a, b) => a - b).map((n) => map.get(n)!)
}

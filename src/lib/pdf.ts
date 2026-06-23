import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import type { CardFace, FlipEdge, SheetSize } from '../types'
import { SHEET_SIZES } from './cardSizes'
import { groupByCard, renderSheets, type GuideOptions, type SheetCard } from './pdfLayout'

export interface GeneratePdfParams {
  faces: CardFace[]
  /** Capture source elements, one per face, in the same order as `faces`. */
  nodes: HTMLElement[]
  cardWidthMm: number
  cardHeightMm: number
  sheetSize: SheetSize
  doubleSided: boolean
  flipEdge: FlipEdge
  guides: GuideOptions
  /** Card background colour (theme) used as the capture backdrop. */
  backgroundColor?: string
}

const CAPTURE_SCALE = 3

export async function captureNodes(
  nodes: HTMLElement[],
  backgroundColor = '#ffffff',
): Promise<string[]> {
  const urls: string[] = []
  for (const node of nodes) {
    const canvas = await html2canvas(node, {
      scale: CAPTURE_SCALE,
      backgroundColor,
      logging: false,
    })
    urls.push(canvas.toDataURL('image/png'))
  }
  return urls
}

export async function buildPdf(params: GeneratePdfParams): Promise<jsPDF | null> {
  const { faces, nodes, cardWidthMm, cardHeightMm, sheetSize, doubleSided, flipEdge, guides } = params
  if (faces.length === 0) return null

  const sheet = SHEET_SIZES[sheetSize]
  const urls = await captureNodes(nodes, params.backgroundColor)

  const pdf = new jsPDF({ unit: 'mm', format: [sheet.widthMm, sheet.heightMm], orientation: 'portrait' })

  const cards: SheetCard<string>[] = doubleSided
    ? groupByCard(faces, urls)
    : urls.map((url) => ({ front: url }))

  renderSheets({
    pdf,
    sheetSize,
    cardWidthMm,
    cardHeightMm,
    doubleSided,
    flipEdge,
    guides,
    cards,
    drawContent: (url, x, y, w, h) => {
      pdf.addImage(url, 'PNG', x, y, w, h)
    },
  })

  return pdf
}

export async function generatePdf(params: GeneratePdfParams): Promise<void> {
  const pdf = await buildPdf(params)
  pdf?.save('cue-cards.pdf')
}

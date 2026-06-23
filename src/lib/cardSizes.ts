import type { CardSize, Orientation, SheetSize } from '../types'

export const MM_PER_INCH = 25.4

export function mmToIn(mm: number): number {
  return mm / MM_PER_INCH
}

export function inToMm(inch: number): number {
  return inch * MM_PER_INCH
}

/** 96 CSS px per inch is the reference used across browsers for physical units. */
export const PX_PER_MM = 96 / MM_PER_INCH

export function mmToPx(mm: number): number {
  return mm * PX_PER_MM
}

/** 1 pt = 1/72 inch. */
export function ptToPx(pt: number): number {
  return (pt / 72) * 96
}

/** Standard cue card sizes. Dimensions are stored portrait (width < height). */
export const CARD_SIZES: CardSize[] = [
  { id: 'a7', label: 'A7', widthMm: 74, heightMm: 105 },
  { id: 'a6', label: 'A6', widthMm: 105, heightMm: 148 },
  { id: 'index-3x5', label: 'Index 3×5"', widthMm: 76, heightMm: 127 },
  { id: 'index-4x6', label: 'Index 4×6"', widthMm: 102, heightMm: 152 },
  { id: 'index-5x8', label: 'Index 5×8"', widthMm: 127, heightMm: 203 },
]

export const CUSTOM_SIZE_ID = 'custom'

/** Build the imperial half of a size label, e.g. "2.9 × 4.1 in". */
export function imperialLabel(widthMm: number, heightMm: number): string {
  const w = mmToIn(widthMm).toFixed(1)
  const h = mmToIn(heightMm).toFixed(1)
  return `${w} × ${h} in`
}

export function metricLabel(widthMm: number, heightMm: number): string {
  return `${round(widthMm)} × ${round(heightMm)} mm`
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

/** Resolve the effective card dimensions in mm for the given settings. */
export function resolveCardSize(
  cardSizeId: string,
  customWidthMm: number,
  customHeightMm: number,
  orientation: Orientation,
): { widthMm: number; heightMm: number } {
  let widthMm: number
  let heightMm: number
  if (cardSizeId === CUSTOM_SIZE_ID) {
    widthMm = customWidthMm
    heightMm = customHeightMm
  } else {
    const size = CARD_SIZES.find((s) => s.id === cardSizeId) ?? CARD_SIZES[0]
    widthMm = size.widthMm
    heightMm = size.heightMm
  }
  if (orientation === 'landscape') {
    return { widthMm: heightMm, heightMm: widthMm }
  }
  return { widthMm, heightMm }
}

/** Printable sheet dimensions in mm (portrait). */
export const SHEET_SIZES: Record<SheetSize, { widthMm: number; heightMm: number }> = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
}

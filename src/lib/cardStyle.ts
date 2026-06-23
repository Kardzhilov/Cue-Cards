import { mmToPx, ptToPx } from './cardSizes'

/** Font stack used for cards (both preview and PDF). */
export const CARD_FONT_FAMILY =
  '"Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif'

export const CARD_LINE_HEIGHT = 1.35

/** Fixed size of the "(current/max)" label. */
export const NUMBER_FONT_PT = 9

/** Base inner padding of a card, in mm. */
const BASE_PADDING_MM = 5

/**
 * When numbers are shown they sit in the padding band, so the padding must be
 * large enough to clear the number label.
 */
function paddingForNumbers(showNumbers: boolean): number {
  if (!showNumbers) return BASE_PADDING_MM
  const numberHeightMm = (NUMBER_FONT_PT / 72) * 25.4
  return Math.max(BASE_PADDING_MM, numberHeightMm + 3)
}

export interface ContentMetrics {
  paddingMm: number
  paddingPx: number
  /** Usable text width inside the padding, in px. */
  contentWidthPx: number
  /** Usable text height inside the padding, in px. */
  contentHeightPx: number
}

export function computeContentMetrics(
  cardWidthMm: number,
  cardHeightMm: number,
  showNumbers: boolean,
): ContentMetrics {
  const paddingMm = paddingForNumbers(showNumbers)
  const paddingPx = mmToPx(paddingMm)
  return {
    paddingMm,
    paddingPx,
    contentWidthPx: mmToPx(cardWidthMm) - 2 * paddingPx,
    contentHeightPx: mmToPx(cardHeightMm) - 2 * paddingPx,
  }
}

export function fontSizePx(fontSizePt: number): number {
  return ptToPx(fontSizePt)
}

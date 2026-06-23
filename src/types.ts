export type NumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type FlipEdge = 'long' | 'short'

export type SheetSize = 'a4' | 'letter'

export type Orientation = 'portrait' | 'landscape'

/** A physical card size in millimetres (the canonical unit). */
export interface CardSize {
  id: string
  /** Human label, e.g. "Index 3×5". */
  label: string
  widthMm: number
  heightMm: number
}

export interface Settings {
  /** Raw markdown the user typed. */
  text: string
  cardSizeId: string
  /** Custom dimensions used when cardSizeId === 'custom'. */
  customWidthMm: number
  customHeightMm: number
  orientation: Orientation
  fontSizePt: number
  doubleSided: boolean
  flipEdge: FlipEdge
  showNumbers: boolean
  showMax: boolean
  numberPosition: NumberPosition
  sheetSize: SheetSize
}

/** One printable face (front or back) belonging to a numbered physical card. */
export interface CardFace {
  /** 1-based physical card number this face belongs to. */
  cardNumber: number
  side: 'front' | 'back'
  /** Markdown content rendered on this face. */
  markdown: string
}

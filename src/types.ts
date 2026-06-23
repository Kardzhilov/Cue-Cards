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

/** What the back of each card holds when double-sided is enabled. */
export type BackMode = 'continue' | 'notes'

/** How the PDF is rendered. */
export type PdfMode = 'raster' | 'vector'

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
  /** Back content style when double-sided. */
  backMode: BackMode
  flipEdge: FlipEdge
  showNumbers: boolean
  showMax: boolean
  numberPosition: NumberPosition
  sheetSize: SheetSize
  /** PDF render mode: rasterized (exact) or vector (selectable text). */
  pdfMode: PdfMode
  /** Bleed in mm added around each card on the sheet (0 = none). */
  bleedMm: number
  /** Draw a dashed safe-area guide inside each card. */
  showSafeArea: boolean
  /** Draw corner crop marks around each card. */
  showCropMarks: boolean
}

/** One printable face (front or back) belonging to a numbered physical card. */
export interface CardFace {
  /** 1-based physical card number this face belongs to. */
  cardNumber: number
  side: 'front' | 'back'
  /** Markdown content rendered on this face. */
  markdown: string
  /** True when this face is a blank notes back rather than text content. */
  isNotes?: boolean
  /** True when the content overflows the card at the chosen font size. */
  overflow?: boolean
}

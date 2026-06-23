export interface CardTheme {
  id: string
  label: string
  /** Card background colour. */
  bg: string
  /** Body text colour. */
  fg: string
  /** Muted colour for the card number and notes label. */
  muted: string
  /** Border colour, or null for no border. */
  border: string | null
}

export const CARD_THEMES: CardTheme[] = [
  { id: 'minimal', label: 'Minimal (white)', bg: '#ffffff', fg: '#111111', muted: '#555555', border: null },
  { id: 'bordered', label: 'Bordered', bg: '#ffffff', fg: '#111111', muted: '#555555', border: '#c9ced6' },
  { id: 'paper', label: 'Paper (cream)', bg: '#fdf6e3', fg: '#433422', muted: '#8a7a5c', border: '#e8dcc0' },
  { id: 'slate', label: 'Slate (dark)', bg: '#1f2430', fg: '#f3f4f6', muted: '#aab1c0', border: null },
  { id: 'highlight', label: 'Highlighter', bg: '#fffdf2', fg: '#1a1a1a', muted: '#6b6440', border: '#f0e6a8' },
]

export const DEFAULT_THEME_ID = 'minimal'

export function getTheme(id: string): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]
}

/** Convert a #rrggbb hex colour to an {r,g,b} triple for jsPDF. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

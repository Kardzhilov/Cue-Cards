const AVG_CHAR_EM = 0.5
const BOLD_LINES = 1.5
export const CUE_FADE_CHARS = 10

/** How many characters get full bold, and the fade length, for a card. */
export function cueBudget(contentWidthPx: number, fontSizePx: number): {
  boldChars: number
  fadeChars: number
} {
  const charsPerLine = Math.max(8, contentWidthPx / (fontSizePx * AVG_CHAR_EM))
  return { boldChars: Math.round(charsPerLine * BOLD_LINES), fadeChars: CUE_FADE_CHARS }
}

/** Font weight at character index `i`, fading 700 → 400 across the fade zone. */
function weightAt(i: number, boldChars: number, fadeChars: number): number {
  if (i < boldChars) return 700
  const t = Math.min(1, (i - boldChars) / fadeChars)
  return Math.round((700 - 300 * t) / 100) * 100
}

/**
 * Apply a graded "cue" emphasis to the start of rendered card HTML: the opening
 * ~1.5 lines are bold, then the weight fades to normal over the next few
 * characters. Skipped when the emphasised zone would cover (almost) the whole
 * card. Implemented with per-run `font-weight` spans so it renders identically
 * in the preview and in the html2canvas raster export.
 */
export function emphasizeHtml(html: string, contentWidthPx: number, fontSizePx: number): string {
  if (typeof document === 'undefined') return html
  const { boldChars, fadeChars } = cueBudget(contentWidthPx, fontSizePx)
  const total = boldChars + fadeChars

  const container = document.createElement('div')
  container.innerHTML = html

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let totalChars = 0
  while (walker.nextNode()) {
    const n = walker.currentNode as Text
    nodes.push(n)
    totalChars += n.data.length
  }
  // Too little content for the emphasis to be meaningful — leave it normal.
  if (totalChars <= total) return html

  let idx = 0
  for (const node of nodes) {
    if (idx >= total) break
    const text = node.data
    const frag = document.createDocumentFragment()
    let i = 0
    while (i < text.length && idx < total) {
      const w = weightAt(idx, boldChars, fadeChars)
      let j = i
      while (
        j < text.length &&
        idx + (j - i) < total &&
        weightAt(idx + (j - i), boldChars, fadeChars) === w
      ) {
        j++
      }
      const span = document.createElement('span')
      span.style.fontWeight = String(w)
      span.textContent = text.slice(i, j)
      frag.appendChild(span)
      idx += j - i
      i = j
    }
    if (i < text.length) frag.appendChild(document.createTextNode(text.slice(i)))
    node.parentNode?.replaceChild(frag, node)
  }
  return container.innerHTML
}

/**
 * Vector-PDF approximation of the cue: jsPDF only has bold/normal (no graded
 * weights), so bold roughly the first ~1.5 lines of the opening block by
 * wrapping whole leading words in `**`. Skipped when the card is too short.
 */
export function boldLeadingChars(
  markdown: string,
  contentWidthPx: number,
  fontSizePx: number,
): string {
  const { boldChars, fadeChars } = cueBudget(contentWidthPx, fontSizePx)
  const plain = markdown.replace(/\s+/g, ' ').trim()
  if (plain.length <= boldChars + fadeChars) return markdown

  const lines = markdown.split('\n')
  const li = lines.findIndex((l) => l.trim() !== '')
  if (li < 0) return markdown
  const raw = lines[li]
  const m = raw.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)?)([\s\S]*)$/)
  const prefix = m ? m[1] : ''
  const content = m ? m[2] : raw
  if (!content.trim() || content.trimStart().startsWith('**')) return markdown

  const tokens = content.split(/(\s+)/)
  let acc = ''
  let count = 0
  for (const tok of tokens) {
    if (/^\s+$/.test(tok)) {
      acc += tok
      continue
    }
    if (count > 0 && count + tok.length > boldChars) break
    acc += tok
    count += tok.length
  }
  const head = acc.replace(/\s+$/, '')
  const trailingWs = acc.slice(head.length)
  const rest = content.slice(acc.length)
  if (!head) return markdown

  lines[li] = `${prefix}**${head}**${trailingWs}${rest}`
  return lines.join('\n')
}

/**
 * Bold the opening sentence of a card's markdown as a quick visual cue.
 *
 * Implemented as real `**bold**` markup (rather than a CSS `::first-line`
 * pseudo-element) so it renders identically in the preview, the rasterised
 * PDF/PNG capture (html2canvas does not support `::first-line`), and the
 * vector PDF.
 */
export function applyCueEmphasis(markdown: string): string {
  const lines = markdown.split('\n')
  const i = lines.findIndex((l) => l.trim() !== '')
  if (i < 0) return markdown

  const raw = lines[i]
  // Separate a leading block marker (heading, list bullet, blockquote) from the text.
  const m = raw.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)?)([\s\S]*)$/)
  const prefix = m ? m[1] : ''
  const content = m ? m[2] : raw
  if (!content.trim()) return markdown
  // Don't double-emphasise content the author already started with bold.
  if (content.trimStart().startsWith('**')) return markdown

  // First sentence (up to . ! ? and optional closing quote/bracket), else whole line.
  const sm = content.match(/^(.*?[.!?]["')\]]?)(\s|$)/)
  const head = sm ? sm[1] : content
  const rest = content.slice(head.length)
  const lead = head.match(/^\s*/)?.[0] ?? ''
  const headText = head.slice(lead.length)
  if (!headText) return markdown

  lines[i] = `${prefix}${lead}**${headText}**${rest}`
  return lines.join('\n')
}

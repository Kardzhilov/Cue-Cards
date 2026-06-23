import { CARD_FONT_FAMILY, CARD_LINE_HEIGHT } from './cardStyle'
import { markdownToHtml } from './markdownToHtml'

export interface MeasureOptions {
  contentWidthPx: number
  fontSizePx: number
}

let container: HTMLDivElement | null = null

/** Lazily create a single reusable offscreen measuring node. */
function getContainer(): HTMLDivElement {
  if (container && container.isConnected) return container
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.className = 'card-content'
  Object.assign(el.style, {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    visibility: 'hidden',
    boxSizing: 'content-box',
    fontFamily: CARD_FONT_FAMILY,
    lineHeight: String(CARD_LINE_HEIGHT),
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(el)
  container = el
  return el
}

/**
 * Measure the rendered height (px) of the given markdown when laid out in a
 * card of `contentWidthPx` width at `fontSizePx`.
 */
export function measureMarkdownHeight(markdown: string, opts: MeasureOptions): number {
  const el = getContainer()
  el.style.width = `${opts.contentWidthPx}px`
  el.style.fontSize = `${opts.fontSizePx}px`
  el.innerHTML = markdownToHtml(markdown)
  return el.scrollHeight
}

/** Remove the measuring node (e.g. on teardown). */
export function disposeMeasure(): void {
  if (container && container.isConnected) {
    container.remove()
  }
  container = null
}

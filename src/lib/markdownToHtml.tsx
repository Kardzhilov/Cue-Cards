import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Render markdown to an HTML string. The same react-markdown configuration is
 * used for the on-screen preview so measurement and rendering stay consistent.
 */
export function markdownToHtml(markdown: string): string {
  return renderToStaticMarkup(<Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>)
}

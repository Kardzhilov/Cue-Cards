import type { FoldBackKind } from '../types'
import { mmToPx, ptToPx } from '../lib/cardSizes'
import { Card, type CardProps } from './Card'

export interface FoldPanelProps extends CardProps {
  foldBackKind: FoldBackKind
  foldBackText: string
  foldBackImage: string | null
}

/**
 * A fold-and-glue panel: the front card sits on the bottom half and the
 * (uniform) back sits on the top half rotated 180°, so that once the panel is
 * folded over the centre crease and glued, the back reads right-side up.
 */
export function FoldPanel(props: FoldPanelProps) {
  const { widthMm, heightMm, paddingMm, fontSizePt, theme, foldBackKind, foldBackText, foldBackImage } =
    props
  const wPx = mmToPx(widthMm)
  const hPx = mmToPx(heightMm)

  return (
    <div
      data-card
      className="fold-panel"
      style={{ width: `${wPx}px`, height: `${hPx * 2}px`, background: theme.bg, color: theme.fg }}
    >
      <div className="fold-back" style={{ height: `${hPx}px`, padding: `${mmToPx(paddingMm)}px` }}>
        <div className="fold-back-inner">
          {foldBackKind === 'graphic' && foldBackImage && (
            <img src={foldBackImage} alt="" className="fold-back-img" />
          )}
          {foldBackKind === 'text' && foldBackText && (
            <div className="fold-back-text" style={{ fontSize: `${ptToPx(fontSizePt)}px` }}>
              {foldBackText}
            </div>
          )}
        </div>
      </div>
      <div className="fold-line" aria-hidden="true" />
      <Card {...props} />
    </div>
  )
}

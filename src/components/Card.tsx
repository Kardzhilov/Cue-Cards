import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CardFace, NumberPosition, TextAlign } from '../types'
import { mmToPx, ptToPx } from '../lib/cardSizes'
import type { CardTheme } from '../lib/cardThemes'
import { applyCueEmphasis } from '../lib/cueEmphasis'

export interface CardProps {
  face: CardFace
  widthMm: number
  heightMm: number
  paddingMm: number
  fontSizePt: number
  showNumbers: boolean
  showMax: boolean
  numberPosition: NumberPosition
  totalCards: number
  theme: CardTheme
  lineHeight: number
  textAlign: TextAlign
  cueEmphasis: boolean
  /** Show the safe-area guide overlay (used in the on-screen preview). */
  showGuidesOverlay?: boolean
  showSafeArea?: boolean
  safeMarginMm?: number
}

export function Card({
  face,
  widthMm,
  heightMm,
  paddingMm,
  fontSizePt,
  showNumbers,
  showMax,
  numberPosition,
  totalCards,
  theme,
  lineHeight,
  textAlign,
  cueEmphasis,
  showGuidesOverlay,
  showSafeArea,
  safeMarginMm,
}: CardProps) {
  const label = showMax ? `${face.cardNumber}/${totalCards}` : `${face.cardNumber}`
  return (
    <div
      data-card
      className="card"
      style={{
        width: `${mmToPx(widthMm)}px`,
        height: `${mmToPx(heightMm)}px`,
        padding: `${mmToPx(paddingMm)}px`,
        fontSize: `${ptToPx(fontSizePt)}px`,
        lineHeight,
        textAlign,
        background: theme.bg,
        color: theme.fg,
        boxShadow: theme.border ? `inset 0 0 0 1px ${theme.border}` : 'none',
        ['--notes-line' as string]: theme.border ?? '#dcdfe5',
        ['--notes-label' as string]: theme.muted,
      }}
    >
      <div className="card-content">
        {face.isNotes ? (
          <div className="card-notes" aria-label="Notes area">
            <span className="card-notes-label">Notes</span>
            <div className="card-notes-lines" />
          </div>
        ) : (
          <Markdown remarkPlugins={[remarkGfm]}>
            {cueEmphasis ? applyCueEmphasis(face.markdown) : face.markdown}
          </Markdown>
        )}
      </div>
      {showGuidesOverlay && showSafeArea && (
        <div
          className="card-safe-guide"
          aria-hidden="true"
          style={{ inset: `${mmToPx(safeMarginMm ?? paddingMm)}px` }}
        />
      )}
      {showNumbers && (
        <span className={`card-number pos-${numberPosition}`} style={{ color: theme.muted }}>
          {label}
        </span>
      )}
    </div>
  )
}

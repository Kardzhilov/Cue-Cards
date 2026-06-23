import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CardFace, NumberPosition } from '../types'
import { mmToPx, ptToPx } from '../lib/cardSizes'

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
      }}
    >
      <div className="card-content">
        {face.isNotes ? (
          <div className="card-notes" aria-label="Notes area">
            <span className="card-notes-label">Notes</span>
            <div className="card-notes-lines" />
          </div>
        ) : (
          <Markdown remarkPlugins={[remarkGfm]}>{face.markdown}</Markdown>
        )}
      </div>
      {showNumbers && <span className={`card-number pos-${numberPosition}`}>{label}</span>}
    </div>
  )
}

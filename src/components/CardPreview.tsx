import type { CardFace, NumberPosition } from '../types'
import { mmToPx } from '../lib/cardSizes'
import { Card } from './Card'

const PREVIEW_CARD_WIDTH_PX = 240

export interface CardPreviewProps {
  faces: CardFace[]
  widthMm: number
  heightMm: number
  paddingMm: number
  fontSizePt: number
  showNumbers: boolean
  showMax: boolean
  numberPosition: NumberPosition
  totalCards: number
  doubleSided: boolean
}

export function CardPreview(props: CardPreviewProps) {
  const { faces, widthMm, heightMm, doubleSided } = props
  const scale = PREVIEW_CARD_WIDTH_PX / mmToPx(widthMm)
  const wrapperHeight = mmToPx(heightMm) * scale

  if (faces.length === 0) {
    return <p className="preview-empty">Type some text to see your cue cards here.</p>
  }

  return (
    <div className="preview-grid">
      {faces.map((face, i) => (
        <figure key={i} className="preview-item">
          <div className="preview-scaler" style={{ width: PREVIEW_CARD_WIDTH_PX, height: wrapperHeight }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <Card {...props} face={face} />
            </div>
          </div>
          <figcaption>
            Card {face.cardNumber}
            {doubleSided ? ` · ${face.side}` : ''}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

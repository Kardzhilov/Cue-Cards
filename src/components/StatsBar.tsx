export interface StatsBarProps {
  words: number
  chars: number
  faceCount: number
  cardCount: number
  doubleSided: boolean
  overflowCount: number
}

export function StatsBar({ words, chars, faceCount, cardCount, doubleSided, overflowCount }: StatsBarProps) {
  return (
    <div className="stats" role="status" aria-live="polite">
      <span><strong>{words}</strong> words</span>
      <span><strong>{chars}</strong> chars</span>
      <span><strong>{cardCount}</strong> card{cardCount === 1 ? '' : 's'}</span>
      {doubleSided && <span><strong>{faceCount}</strong> faces</span>}
      {overflowCount > 0 && (
        <span className="stats-warn" title="Some content is too large to fit; increase the card size or lower the font size.">
          ⚠ {overflowCount} overflowing
        </span>
      )}
    </div>
  )
}

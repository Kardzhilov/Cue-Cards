import type { CardFace } from '../types'
import { measureMarkdownHeight } from './measure'

export interface SplitOptions {
  contentWidthPx: number
  contentHeightPx: number
  fontSizePx: number
  doubleSided: boolean
}

export interface SplitResult {
  faces: CardFace[]
  totalCards: number
}

type JoinKind = 'block' | 'line' | 'inline'
type Level = 'block' | 'sentence' | 'clause' | 'word'

interface Unit {
  text: string
  join: JoinKind
  level: Level
}

const JOINERS: Record<JoinKind, string> = {
  block: '\n\n',
  line: '\n',
  inline: ' ',
}

/** Matches a markdown horizontal-rule line, used as a manual "new card" break. */
const DELIMITER_RE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/

/** Split raw text into segments on manual delimiter lines. */
function splitSegments(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const segments: string[] = []
  let current: string[] = []
  for (const line of lines) {
    if (DELIMITER_RE.test(line)) {
      segments.push(current.join('\n'))
      current = []
    } else {
      current.push(line)
    }
  }
  segments.push(current.join('\n'))
  return segments.map((s) => s.trim()).filter((s) => s.length > 0)
}

const LIST_ITEM_RE = /^(\s*([-*+]|\d+[.)])\s)/

/** Break a segment into block-level units (paragraphs, headings, list items…). */
function tokenizeSegment(segment: string): Unit[] {
  const blocks = segment.split(/\n\s*\n/).map((b) => b.replace(/\s+$/, ''))
  const units: Unit[] = []
  for (const block of blocks) {
    if (!block.trim()) continue
    const lines = block.split('\n')
    const isList = lines.every((l) => !l.trim() || LIST_ITEM_RE.test(l))
    if (isList && lines.length > 1) {
      // Each list item becomes its own line-joined unit so a list can break
      // across cards while still rendering as a list.
      lines.forEach((line, i) => {
        if (!line.trim()) return
        units.push({ text: line, join: i === 0 ? 'block' : 'line', level: 'block' })
      })
    } else {
      units.push({ text: block, join: 'block', level: 'block' })
    }
  }
  return units
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?]["')\]]?)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function splitClauses(text: string): string[] {
  return text
    .split(/(?<=[,;:—–])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/** Produce finer units from a unit that does not fit on a card by itself. */
function refineUnit(unit: Unit): Unit[] {
  let pieces: string[]
  let nextLevel: Level
  switch (unit.level) {
    case 'block':
      pieces = splitSentences(unit.text)
      nextLevel = 'sentence'
      break
    case 'sentence':
      pieces = splitClauses(unit.text)
      nextLevel = 'clause'
      break
    case 'clause':
      pieces = splitWords(unit.text)
      nextLevel = 'word'
      break
    default:
      return [unit]
  }
  if (pieces.length <= 1) {
    // Could not divide at this level; drop straight to the next finer level.
    return refineUnit({ ...unit, level: nextLevel })
  }
  return pieces.map((text, i) => ({
    text,
    join: i === 0 ? unit.join : 'inline',
    level: nextLevel,
  }))
}

/** Greedily pack units into face-sized chunks of markdown. */
function packFaces(units: Unit[], opts: SplitOptions): string[] {
  const faces: string[] = []
  let current = ''
  const queue = [...units]

  const fits = (text: string): boolean =>
    measureMarkdownHeight(text, {
      contentWidthPx: opts.contentWidthPx,
      fontSizePx: opts.fontSizePx,
    }) <= opts.contentHeightPx

  while (queue.length > 0) {
    const unit = queue.shift()!
    const candidate = current ? current + JOINERS[unit.join] + unit.text : unit.text

    if (fits(candidate)) {
      current = candidate
      continue
    }

    // Doesn't fit. First flush whatever we have so the unit can try a fresh face.
    if (current) {
      faces.push(current)
      current = ''
      if (fits(unit.text)) {
        current = unit.text
        continue
      }
    }

    // Unit alone still overflows: refine it into finer pieces.
    const finer = refineUnit(unit)
    if (finer.length > 1) {
      queue.unshift(...finer)
      continue
    }

    // Atomic and still too big (e.g. one very long word): place it alone.
    faces.push(unit.text)
  }

  if (current) faces.push(current)
  return faces
}

export function splitIntoFaces(text: string, opts: SplitOptions): SplitResult {
  const segments = splitSegments(text)
  const faces: string[] = []
  for (const segment of segments) {
    const units = tokenizeSegment(segment)
    faces.push(...packFaces(units, opts))
  }

  const totalCards = opts.doubleSided ? Math.ceil(faces.length / 2) : faces.length

  const cardFaces: CardFace[] = faces.map((markdown, i) => {
    if (opts.doubleSided) {
      return {
        markdown,
        cardNumber: Math.floor(i / 2) + 1,
        side: i % 2 === 0 ? 'front' : 'back',
      }
    }
    return { markdown, cardNumber: i + 1, side: 'front' }
  })

  return { faces: cardFaces, totalCards }
}

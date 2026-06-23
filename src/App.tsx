import { useEffect, useMemo, useRef, useState } from 'react'
import type { Settings } from './types'
import { resolveCardSize } from './lib/cardSizes'
import { computeContentMetrics, fontSizePx } from './lib/cardStyle'
import { splitIntoFaces } from './lib/splitter'
import { generatePdf } from './lib/pdf'
import { Card } from './components/Card'
import { CardPreview } from './components/CardPreview'
import { SettingsPanel } from './components/SettingsPanel'

const SAMPLE_TEXT = `# Welcome to Cue Cards

Type or paste your text on the left. It is automatically split across cards based on the card size and font size you choose.

The generator never breaks in the middle of a sentence. Long sentences fall back to clause and then word boundaries only when they have to.

---

Use a horizontal rule to force a new card. **Bold**, *italic*, and lists all work:

- First point
- Second point
- Third point`

const DEFAULT_SETTINGS: Settings = {
  text: SAMPLE_TEXT,
  cardSizeId: 'index-3x5',
  customWidthMm: 90,
  customHeightMm: 140,
  orientation: 'landscape',
  fontSizePt: 16,
  doubleSided: false,
  flipEdge: 'long',
  showNumbers: true,
  showMax: true,
  numberPosition: 'bottom-right',
  sheetSize: 'a4',
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [faces, setFaces] = useState<ReturnType<typeof splitIntoFaces>>({ faces: [], totalCards: 0 })
  const [generating, setGenerating] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const patch = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }))

  const { widthMm, heightMm } = useMemo(
    () =>
      resolveCardSize(
        settings.cardSizeId,
        settings.customWidthMm,
        settings.customHeightMm,
        settings.orientation,
      ),
    [settings.cardSizeId, settings.customWidthMm, settings.customHeightMm, settings.orientation],
  )

  const metrics = useMemo(
    () => computeContentMetrics(widthMm, heightMm, settings.showNumbers),
    [widthMm, heightMm, settings.showNumbers],
  )

  // Re-split (debounced) whenever inputs that affect layout change.
  useEffect(() => {
    const handle = setTimeout(() => {
      const result = splitIntoFaces(settings.text, {
        contentWidthPx: metrics.contentWidthPx,
        contentHeightPx: metrics.contentHeightPx,
        fontSizePx: fontSizePx(settings.fontSizePt),
        doubleSided: settings.doubleSided,
      })
      setFaces(result)
    }, 250)
    return () => clearTimeout(handle)
  }, [
    settings.text,
    settings.fontSizePt,
    settings.doubleSided,
    metrics.contentWidthPx,
    metrics.contentHeightPx,
  ])

  const cardProps = {
    widthMm,
    heightMm,
    paddingMm: metrics.paddingMm,
    fontSizePt: settings.fontSizePt,
    showNumbers: settings.showNumbers,
    showMax: settings.showMax,
    numberPosition: settings.numberPosition,
    totalCards: faces.totalCards,
  }

  const handleGenerate = async () => {
    const root = printRef.current
    if (!root || faces.faces.length === 0) return
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-card]'))
    setGenerating(true)
    try {
      await generatePdf({
        faces: faces.faces,
        nodes,
        cardWidthMm: widthMm,
        cardHeightMm: heightMm,
        sheetSize: settings.sheetSize,
        doubleSided: settings.doubleSided,
        flipEdge: settings.flipEdge,
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cue-Card Generator</h1>
        <p>Split text across printable cue cards and export a print-ready PDF.</p>
      </header>

      <main className="layout">
        <section className="panel input-panel">
          <label className="field">
            <span>Your text (Markdown supported)</span>
            <textarea
              value={settings.text}
              onChange={(e) => patch({ text: e.target.value })}
              rows={16}
              spellCheck
            />
          </label>
          <SettingsPanel settings={settings} onChange={patch} />
          <button
            className="generate"
            onClick={handleGenerate}
            disabled={generating || faces.faces.length === 0}
          >
            {generating ? 'Generating…' : `Download PDF (${faces.totalCards} card${faces.totalCards === 1 ? '' : 's'})`}
          </button>
        </section>

        <section className="panel preview-panel">
          <h2>Preview</h2>
          <CardPreview {...cardProps} faces={faces.faces} doubleSided={settings.doubleSided} />
        </section>
      </main>

      {/* Off-screen full-size cards used as the source for PDF rasterization. */}
      <div className="print-root" ref={printRef} aria-hidden="true">
        {faces.faces.map((face, i) => (
          <Card key={i} {...cardProps} face={face} />
        ))}
      </div>
    </div>
  )
}

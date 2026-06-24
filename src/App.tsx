import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Settings } from './types'
import { resolveCardSize } from './lib/cardSizes'
import { computeContentMetrics, fontSizePx } from './lib/cardStyle'
import { splitIntoFaces } from './lib/splitter'
import { generatePdf, buildPdf } from './lib/pdf'
import { generateVectorPdf, buildVectorPdf } from './lib/pdfVector'
import { exportPngZip, buildPngZipBlob } from './lib/exportImages'
import { useHistory } from './hooks/useHistory'
import { getTheme, DEFAULT_THEME_ID } from './lib/cardThemes'
import { Card } from './components/Card'
import { FoldPanel } from './components/FoldPanel'
import { CardPreview } from './components/CardPreview'
import { SettingsPanel } from './components/SettingsPanel'
import { StatsBar } from './components/StatsBar'

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
  sides: 'single',
  backMode: 'continue',
  flipEdge: 'long',
  showNumbers: true,
  showMax: true,
  numberPosition: 'bottom-right',
  sheetSize: 'a4',
  pdfMode: 'raster',
  bleedMm: 0,
  showSafeArea: false,
  showCropMarks: false,
  themeId: DEFAULT_THEME_ID,
  darkMode: false,
  lineHeight: 1.35,
  textAlign: 'left',
  cueEmphasis: false,
  foldBackKind: 'blank',
  foldBackText: '',
  foldBackImage: null,
}

const ACCEPTED_FILES = '.txt,.md,.markdown,text/plain,text/markdown'

export default function App() {
  const history = useHistory<Settings>(DEFAULT_SETTINGS)
  const settings = history.state
  const [result, setResult] = useState<ReturnType<typeof splitIntoFaces>>({
    faces: [],
    totalCards: 0,
    overflowCount: 0,
  })
  const [busy, setBusy] = useState<null | 'pdf' | 'png'>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const patch = useCallback(
    (p: Partial<Settings>) => history.set({ ...history.state, ...p }),
    [history],
  )
  const setText = useCallback(
    (text: string) => history.set({ ...history.state, text }, true),
    [history],
  )

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

  const theme = useMemo(() => getTheme(settings.themeId), [settings.themeId])

  const doubleSided = settings.sides === 'double'
  const fold = settings.sides === 'fold'

  // Apply app dark mode to the document root.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light'
  }, [settings.darkMode])

  // Re-split (debounced) whenever inputs that affect layout change.
  useEffect(() => {
    const handle = setTimeout(() => {
      setResult(
        splitIntoFaces(settings.text, {
          contentWidthPx: metrics.contentWidthPx,
          contentHeightPx: metrics.contentHeightPx,
          fontSizePx: fontSizePx(settings.fontSizePt),
          doubleSided,
          backMode: settings.backMode,
          lineHeight: settings.lineHeight,
          cueEmphasis: settings.cueEmphasis,
        }),
      )
    }, 250)
    return () => clearTimeout(handle)
  }, [
    settings.text,
    settings.fontSizePt,
    doubleSided,
    settings.backMode,
    settings.lineHeight,
    settings.cueEmphasis,
    metrics.contentWidthPx,
    metrics.contentHeightPx,
  ])

  // Keyboard: undo / redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        history.undo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        history.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [history])

  const cardProps = {
    widthMm,
    heightMm,
    paddingMm: metrics.paddingMm,
    fontSizePt: settings.fontSizePt,
    showNumbers: settings.showNumbers,
    showMax: settings.showMax,
    numberPosition: settings.numberPosition,
    totalCards: result.totalCards,
    theme,
    lineHeight: settings.lineHeight,
    textAlign: settings.textAlign,
    cueEmphasis: settings.cueEmphasis,
    showSafeArea: settings.showSafeArea,
    safeMarginMm: metrics.paddingMm,
  }

  const guides = {
    bleedMm: settings.bleedMm,
    showSafeArea: settings.showSafeArea,
    safeMarginMm: metrics.paddingMm,
    showCropMarks: settings.showCropMarks,
  }

  const stats = useMemo(() => {
    const trimmed = settings.text.trim()
    return {
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      chars: settings.text.length,
    }
  }, [settings.text])

  const getNodes = () =>
    printRef.current
      ? Array.from(printRef.current.querySelectorAll<HTMLElement>(':scope > [data-card]'))
      : []

  const rasterParams = () => ({
    faces: result.faces,
    nodes: getNodes(),
    cardWidthMm: widthMm,
    // In fold mode each captured node is a double-height panel (front + rotated back).
    cardHeightMm: fold ? heightMm * 2 : heightMm,
    sheetSize: settings.sheetSize,
    doubleSided: fold ? false : doubleSided,
    flipEdge: settings.flipEdge,
    guides,
    backgroundColor: theme.bg,
  })

  const vectorParams = () => ({
    faces: result.faces,
    cardWidthMm: widthMm,
    cardHeightMm: heightMm,
    sheetSize: settings.sheetSize,
    doubleSided,
    flipEdge: settings.flipEdge,
    guides,
    style: {
      fontSizePt: settings.fontSizePt,
      paddingMm: metrics.paddingMm,
      showNumbers: settings.showNumbers,
      showMax: settings.showMax,
      numberPosition: settings.numberPosition,
      totalCards: result.totalCards,
      lineHeight: settings.lineHeight,
      textAlign: settings.textAlign,
      cueEmphasis: settings.cueEmphasis,
      theme,
    },
  })

  // Dev-only test hook: lets automated checks obtain export output as a Blob
  // WITHOUT triggering a browser download (no save dialog). Stripped from prod.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as { __cueCardsTest?: unknown }
    w.__cueCardsTest = {
      async pdf(): Promise<Blob | null> {
        if (result.faces.length === 0) return null
        if (settings.pdfMode === 'vector' && !fold) {
          return buildVectorPdf(vectorParams())?.output('blob') ?? null
        }
        return (await buildPdf(rasterParams()))?.output('blob') ?? null
      },
      async pngZip(): Promise<Blob | null> {
        return buildPngZipBlob(result.faces, getNodes(), theme.bg)
      },
    }
    return () => {
      delete (window as unknown as { __cueCardsTest?: unknown }).__cueCardsTest
    }
  })

  const handleGenerate = async () => {
    if (result.faces.length === 0) return
    setBusy('pdf')
    try {
      // Fold mode always uses the raster panel pipeline (rotated back baked in).
      if (settings.pdfMode === 'vector' && !fold) {
        generateVectorPdf(vectorParams())
      } else {
        await generatePdf(rasterParams())
      }
    } finally {
      setBusy(null)
    }
  }

  const handleExportPng = async () => {
    if (result.faces.length === 0) return
    setBusy('png')
    try {
      await exportPngZip(result.faces, getNodes(), theme.bg)
    } finally {
      setBusy(null)
    }
  }

  const importFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    patch({ text })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    void importFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-text">
          <h1>Cue-Card Generator</h1>
          <p>Split text across printable cue cards and export a print-ready PDF.</p>
        </div>
        <button
          type="button"
          className="ghost theme-toggle"
          onClick={() => patch({ darkMode: !settings.darkMode })}
          aria-pressed={settings.darkMode}
          title={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {settings.darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main className="layout">
        <section className="panel input-panel">
          <div className="toolbar" role="toolbar" aria-label="Text actions">
            <button
              type="button"
              className="ghost"
              onClick={() => history.undo()}
              disabled={!history.canUndo}
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
            >
              ↺ Undo
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => history.redo()}
              disabled={!history.canRedo}
              aria-label="Redo"
              title="Redo (Ctrl+Shift+Z)"
            >
              ↻ Redo
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => fileInputRef.current?.click()}
              title="Import a .txt or .md file"
            >
              📂 Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              className="visually-hidden"
              onChange={(e) => {
                void importFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>

          <label className="field">
            <span>Your text (Markdown supported — drag a file here too)</span>
            <textarea
              value={settings.text}
              onChange={(e) => setText(e.target.value)}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              rows={14}
              spellCheck
              aria-label="Cue card text input"
            />
          </label>

          <StatsBar
            words={stats.words}
            chars={stats.chars}
            faceCount={result.faces.length}
            cardCount={result.totalCards}
            doubleSided={doubleSided}
            overflowCount={result.overflowCount}
          />

          <SettingsPanel settings={settings} onChange={patch} />

          <div className="actions">
            <button
              className="generate"
              onClick={handleGenerate}
              disabled={busy !== null || result.faces.length === 0}
            >
              {busy === 'pdf'
                ? 'Generating…'
                : `Download PDF (${result.totalCards} card${result.totalCards === 1 ? '' : 's'})`}
            </button>
            <button
              className="secondary"
              onClick={handleExportPng}
              disabled={busy !== null || result.faces.length === 0}
              title="Download a zip with one PNG per card"
            >
              {busy === 'png' ? 'Exporting…' : 'Export PNGs'}
            </button>
          </div>
        </section>

        <section className="panel preview-panel" aria-label="Card preview">
          <h2>Preview</h2>
          <CardPreview
            {...cardProps}
            faces={result.faces}
            doubleSided={doubleSided}
            fold={fold}
            foldBackKind={settings.foldBackKind}
            foldBackText={settings.foldBackText}
            foldBackImage={settings.foldBackImage}
          />
        </section>
      </main>

      {/* Off-screen full-size cards used as the source for PDF/PNG rasterization. */}
      <div className="print-root" ref={printRef} aria-hidden="true">
        {result.faces.map((face, i) =>
          fold ? (
            <FoldPanel
              key={i}
              {...cardProps}
              face={face}
              foldBackKind={settings.foldBackKind}
              foldBackText={settings.foldBackText}
              foldBackImage={settings.foldBackImage}
            />
          ) : (
            <Card key={i} {...cardProps} face={face} />
          ),
        )}
      </div>
    </div>
  )
}

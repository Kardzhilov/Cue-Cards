import type { NumberPosition, Settings, TextAlign } from '../types'
import {
  CARD_SIZES,
  CUSTOM_SIZE_ID,
  imperialLabel,
  metricLabel,
  mmToIn,
} from '../lib/cardSizes'
import { CARD_THEMES } from '../lib/cardThemes'

export interface SettingsPanelProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

const NUMBER_POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: 'top-left', label: 'Top left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
]

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const isCustom = settings.cardSizeId === CUSTOM_SIZE_ID

  return (
    <div className="settings">
      <h2>Settings</h2>

      <label className="field">
        <span>Card size</span>
        <select
          value={settings.cardSizeId}
          onChange={(e) => onChange({ cardSizeId: e.target.value })}
        >
          {CARD_SIZES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} — {metricLabel(s.widthMm, s.heightMm)} ({imperialLabel(s.widthMm, s.heightMm)})
            </option>
          ))}
          <option value={CUSTOM_SIZE_ID}>Custom…</option>
        </select>
      </label>

      {isCustom && (
        <div className="field-row">
          <label className="field">
            <span>Width (mm)</span>
            <input
              type="number"
              min={20}
              max={300}
              value={settings.customWidthMm}
              onChange={(e) => onChange({ customWidthMm: Number(e.target.value) })}
            />
            <small>{mmToIn(settings.customWidthMm).toFixed(2)} in</small>
          </label>
          <label className="field">
            <span>Height (mm)</span>
            <input
              type="number"
              min={20}
              max={400}
              value={settings.customHeightMm}
              onChange={(e) => onChange({ customHeightMm: Number(e.target.value) })}
            />
            <small>{mmToIn(settings.customHeightMm).toFixed(2)} in</small>
          </label>
        </div>
      )}

      <label className="field">
        <span>Orientation</span>
        <select
          value={settings.orientation}
          onChange={(e) => onChange({ orientation: e.target.value as Settings['orientation'] })}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </label>

      <label className="field">
        <span>Font size (pt)</span>
        <input
          type="number"
          min={6}
          max={72}
          value={settings.fontSizePt}
          onChange={(e) => onChange({ fontSizePt: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Sides</span>
        <select
          value={settings.sides}
          onChange={(e) => onChange({ sides: e.target.value as Settings['sides'] })}
        >
          <option value="single">Single-sided</option>
          <option value="double">Double-sided (duplex)</option>
          <option value="fold">Fold &amp; glue</option>
        </select>
      </label>

      {settings.sides === 'double' && (
        <>
          <label className="field">
            <span>Back content</span>
            <select
              value={settings.backMode}
              onChange={(e) => onChange({ backMode: e.target.value as Settings['backMode'] })}
            >
              <option value="continue">Continue text onto back</option>
              <option value="notes">Blank notes back</option>
            </select>
          </label>
          <label className="field">
            <span>Duplex flip edge</span>
            <select
              value={settings.flipEdge}
              onChange={(e) => onChange({ flipEdge: e.target.value as Settings['flipEdge'] })}
            >
              <option value="long">Long edge</option>
              <option value="short">Short edge</option>
            </select>
          </label>
        </>
      )}

      {settings.sides === 'fold' && (
        <>
          <p className="field-note">
            Prints each card as one panel: the back is placed above the front and rotated 180° so it
            reads upright once you fold along the crease and glue.
          </p>
          <label className="field">
            <span>Back content</span>
            <select
              value={settings.foldBackKind}
              onChange={(e) => onChange({ foldBackKind: e.target.value as Settings['foldBackKind'] })}
            >
              <option value="blank">Blank</option>
              <option value="text">Text (same on every card)</option>
              <option value="graphic">Graphic (same on every card)</option>
            </select>
          </label>
          {settings.foldBackKind === 'text' && (
            <label className="field">
              <span>Back text</span>
              <textarea
                rows={2}
                value={settings.foldBackText}
                onChange={(e) => onChange({ foldBackText: e.target.value })}
                placeholder="e.g. a title, name, or logo text"
              />
            </label>
          )}
          {settings.foldBackKind === 'graphic' && (
            <label className="field">
              <span>Back graphic</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => onChange({ foldBackImage: String(reader.result) })
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
              {settings.foldBackImage && <small>Image loaded ✓</small>}
            </label>
          )}
        </>
      )}

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.showNumbers}
          onChange={(e) => onChange({ showNumbers: e.target.checked })}
        />
        <span>Show card numbers</span>
      </label>

      {settings.showNumbers && (
        <>
          <label className="field">
            <span>Number position</span>
            <select
              value={settings.numberPosition}
              onChange={(e) => onChange({ numberPosition: e.target.value as NumberPosition })}
            >
              {NUMBER_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field checkbox">
            <input
              type="checkbox"
              checked={settings.showMax}
              onChange={(e) => onChange({ showMax: e.target.checked })}
            />
            <span>Show total (current / max)</span>
          </label>
        </>
      )}

      <label className="field">
        <span>Print sheet</span>
        <select
          value={settings.sheetSize}
          onChange={(e) => onChange({ sheetSize: e.target.value as Settings['sheetSize'] })}
        >
          <option value="a4">A4</option>
          <option value="letter">US Letter</option>
        </select>
      </label>

      <h3 className="settings-subhead">Style</h3>

      <label className="field">
        <span>Card theme</span>
        <select
          value={settings.themeId}
          onChange={(e) => onChange({ themeId: e.target.value })}
        >
          {CARD_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Line height: {settings.lineHeight.toFixed(2)}</span>
        <input
          type="range"
          min={1}
          max={2}
          step={0.05}
          value={settings.lineHeight}
          onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
        />
      </label>

      <label className="field">
        <span>Text alignment</span>
        <select
          value={settings.textAlign}
          onChange={(e) => onChange({ textAlign: e.target.value as TextAlign })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="justify">Justify</option>
        </select>
      </label>

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.cueEmphasis}
          onChange={(e) => onChange({ cueEmphasis: e.target.checked })}
        />
        <span>Emphasise first line (cue)</span>
      </label>

      <h3 className="settings-subhead">Output</h3>

      <label className="field">
        <span>PDF text</span>
        <select
          value={settings.pdfMode}
          onChange={(e) => onChange({ pdfMode: e.target.value as Settings['pdfMode'] })}
        >
          <option value="raster">Raster (exact preview)</option>
          <option value="vector">Vector (selectable text)</option>
        </select>
      </label>

      <label className="field">
        <span>Bleed (mm)</span>
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={settings.bleedMm}
          onChange={(e) => onChange({ bleedMm: Number(e.target.value) })}
        />
      </label>

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.showSafeArea}
          onChange={(e) => onChange({ showSafeArea: e.target.checked })}
        />
        <span>Show safe-area guide</span>
      </label>

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.showCropMarks}
          onChange={(e) => onChange({ showCropMarks: e.target.checked })}
        />
        <span>Show crop marks</span>
      </label>
    </div>
  )
}

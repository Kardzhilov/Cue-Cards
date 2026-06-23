import type { NumberPosition, Settings } from '../types'
import {
  CARD_SIZES,
  CUSTOM_SIZE_ID,
  imperialLabel,
  metricLabel,
  mmToIn,
} from '../lib/cardSizes'

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

      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.doubleSided}
          onChange={(e) => onChange({ doubleSided: e.target.checked })}
        />
        <span>Double-sided (text continues on the back)</span>
      </label>

      {settings.doubleSided && (
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
    </div>
  )
}

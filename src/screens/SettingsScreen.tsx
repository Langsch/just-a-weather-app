import { useState } from 'react'
import { PixelIcon } from '../components/PixelIcon'
import { SectionTitle } from '../components/SectionTitle'
import { useI18n } from '../i18n'
import { notificationsSupported, requestNotificationPermission } from '../notifications/daily'
import { useAppState } from '../state/context'
import type { Accent, LanguageSetting, TemperatureUnit, Theme, WindUnit } from '../types/settings'

/** Cores de cada acento para a prévia, independentes do acento atual. */
const ACCENTS: { id: Accent; light: string; dark: string; rgb?: string }[] = [
  { id: 'none', light: '#0e0e0e', dark: '#f4f1ea' },
  { id: 'orange', light: '#d9480f', dark: '#ff7a33', rgb: '255,122,51' },
  { id: 'amber', light: '#a86a00', dark: '#ffb000', rgb: '255,176,0' },
  { id: 'green', light: '#1e7f3a', dark: '#39ff6a', rgb: '57,255,106' },
]

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  full = false,
}: {
  label: string
  value: T
  options: [T, string][]
  onChange: (value: T) => void
  full?: boolean
}) {
  return (
    <div role="group" aria-label={label} className={full ? 'segmented segmented--full' : 'segmented'}>
      {options.map(([id, text]) => (
        <button key={id} type="button" aria-pressed={id === value} onClick={() => onChange(id)}>
          {text}
        </button>
      ))}
    </div>
  )
}

export function SettingsScreen({ dark }: { dark: boolean }) {
  const { settings, updateSettings, favorites } = useAppState()
  const { t } = useI18n()
  const { notification } = settings
  const setNotification = (patch: Partial<typeof notification>) =>
    updateSettings({ notification: { ...notification, ...patch } })
  const [denied, setDenied] = useState(false)

  async function toggleNotification() {
    if (!notification.enabled && notificationsSupported()) {
      const granted = await requestNotificationPermission()
      setDenied(!granted)
      if (!granted) return
    }
    setNotification({ enabled: !notification.enabled })
  }

  return (
    <main className="screen">
      <div className="topbar">
        <h1 className="page-title">{t.settings.title}</h1>
        <span className="topbar__meta">v{__APP_VERSION__}</span>
      </div>

      <SectionTitle>{t.settings.dailyNotification}</SectionTitle>
      <div className="setting">
        <span id="notif-label">{t.settings.dailySummary}</span>
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={notification.enabled}
          aria-labelledby="notif-label"
          onClick={toggleNotification}
        >
          {notification.enabled ? t.settings.on : t.settings.off}
          <span className="switch__track" aria-hidden="true">
            <span className="switch__knob" />
          </span>
        </button>
      </div>
      {denied && (
        <p className="state__text muted" style={{ fontSize: 12, margin: '8px 0' }}>
          {t.settings.denied}
        </p>
      )}
      {!notificationsSupported() && notification.enabled && (
        <p className="state__text muted" style={{ fontSize: 12, margin: '8px 0' }}>
          {t.settings.webOnly}
        </p>
      )}
      <div className={notification.enabled ? undefined : 'setting--disabled'}>
        <label className="setting">
          {t.settings.time}
          <input
            type="time"
            className="field"
            value={notification.time}
            disabled={!notification.enabled}
            onChange={(e) => e.target.value && setNotification({ time: e.target.value })}
          />
        </label>
        <label className="setting">
          {t.settings.city}
          <select
            className="field"
            value={notification.locationId}
            disabled={!notification.enabled}
            onChange={(e) => setNotification({ locationId: e.target.value })}
          >
            <option value="gps">{t.myLocation}</option>
            {favorites.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SectionTitle>{t.settings.units}</SectionTitle>
      <div className="setting">
        {t.settings.temperature}
        <Segmented<TemperatureUnit>
          label={t.settings.temperature}
          value={settings.temperatureUnit}
          options={[
            ['c', '°C'],
            ['f', '°F'],
          ]}
          onChange={(temperatureUnit) => updateSettings({ temperatureUnit })}
        />
      </div>
      <div className="setting">
        {t.settings.wind}
        <Segmented<WindUnit>
          label={t.settings.wind}
          value={settings.windUnit}
          options={[
            ['kmh', 'km/h'],
            ['ms', 'm/s'],
            ['mph', 'mph'],
          ]}
          onChange={(windUnit) => updateSettings({ windUnit })}
        />
      </div>

      <SectionTitle>{t.settings.language}</SectionTitle>
      <Segmented<LanguageSetting>
        full
        label={t.settings.language}
        value={settings.language}
        options={[
          ['auto', t.settings.auto],
          ['en', 'ENGLISH'],
          ['pt', 'PORTUGUÊS'],
        ]}
        onChange={(language) => updateSettings({ language })}
      />

      <SectionTitle>{t.settings.theme}</SectionTitle>
      <Segmented<Theme>
        full
        label={t.settings.theme}
        value={settings.theme}
        options={[
          ['light', t.settings.light],
          ['dark', t.settings.dark],
          ['system', t.settings.auto],
        ]}
        onChange={(theme) => updateSettings({ theme })}
      />

      <SectionTitle>{t.settings.color}</SectionTitle>
      <div role="group" aria-label={t.settings.accentLabel} className="swatches">
        {ACCENTS.map((a) => {
          const [label, name] = t.settings.accents[a.id]
          const color = dark ? a.dark : a.light
          const glow = dark && a.rgb ? `rgba(${a.rgb},0.55)` : null
          return (
            <button
              key={a.id}
              type="button"
              className="swatch"
              aria-pressed={settings.accent === a.id}
              aria-label={name}
              onClick={() => updateSettings({ accent: a.id })}
            >
              <span style={{ color, filter: glow ? `drop-shadow(0 0 5px ${glow})` : undefined, lineHeight: 0 }}>
                <PixelIcon glyph="partly-cloudy" decorative />
              </span>
              <span className="swatch__temp" style={{ color, textShadow: glow ? `0 0 8px ${glow}` : undefined }}>
                24°
              </span>
              <span className="swatch__name">{label}</span>
            </button>
          )
        })}
      </div>

      <p className="credits">{t.settings.credits}</p>
    </main>
  )
}

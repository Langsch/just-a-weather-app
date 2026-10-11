import { useState } from 'react'
import { Loader } from '../components/Loader'
import { PixelIcon } from '../components/PixelIcon'
import { placeName, useI18n } from '../i18n'
import * as fmt from '../lib/format'
import { useAppState } from '../state/context'
import type { ConsensusForecast } from '../types/weather'

interface Props {
  forecast: ConsensusForecast | null
  onBack: () => void
}

export function DaysScreen({ forecast, onBack }: Props) {
  const { settings } = useAppState()
  const { t } = useI18n()
  const [open, setOpen] = useState(0)
  const unit = settings.temperatureUnit
  const days = forecast?.daily ?? []

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" className="topbar__link" onClick={onBack}>
          {t.days.back}
        </button>
        <span className="topbar__meta">{forecast && placeName(forecast.location, t).toUpperCase()}</span>
      </div>

      <h1 className="page-title" style={{ marginTop: 16 }}>
        {t.days.title(days.length || 7)}
      </h1>

      {!forecast ? (
        <Loader stage="fetching" />
      ) : (
        <>
          <div className="topbar__meta" style={{ marginTop: 8 }}>
            {fmt.weekday(days[0].date, t)} {days[0].date.slice(8, 10)} → {fmt.weekday(days.at(-1)!.date, t)}{' '}
            {fmt.shortDate(days.at(-1)!.date, t).toUpperCase()} • {t.days.tapToOpen}
          </div>

          <div className="days-grid days-head label" aria-hidden="true">
            <span>{t.days.day}</span>
            <span>{t.days.sky}</span>
            <span>{t.days.rain}</span>
            <span style={{ textAlign: 'right', paddingRight: 22 }}>{t.days.highLow}</span>
          </div>

          <ul className="days">
            {days.map((d, i) => {
              const expanded = i === open
              const rain = d.precipitationProbabilityMax?.value
              return (
                <li key={d.date}>
                  <button
                    type="button"
                    className="day days-grid"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? -1 : i)}
                  >
                    <span className="day__name">
                      <b>{fmt.weekday(d.date, t)}</b>
                      <span>{i === 0 ? t.days.today : fmt.shortDate(d.date, t)}</span>
                    </span>
                    <PixelIcon glyph={fmt.glyphFor(d.condition?.value)} accent={expanded} />
                    <span className="day__rain">
                      <span className="rain-bar" aria-hidden="true">
                        <span className="dither" style={{ width: `${rain ?? 0}%` }} />
                      </span>
                      {fmt.percent(rain)}
                    </span>
                    <span className="day__temps">
                      <b className="day__max">{fmt.temperature(d.temperatureMax?.value, unit)}</b>
                      <span className="muted">{fmt.temperature(d.temperatureMin?.value, unit)}</span>
                      <span className="day__sign" aria-hidden="true">
                        {expanded ? '−' : '+'}
                      </span>
                    </span>
                  </button>
                  {expanded && (
                    <dl className="day-detail">
                      <div>
                        <dt className="label">{t.days.rain}</dt>
                        <dd>{fmt.millimeters(d.precipitationSum?.value, t)}</dd>
                      </div>
                      <div>
                        <dt className="label">{t.days.maxWind}</dt>
                        <dd>{fmt.windSpeed(d.windSpeedMax?.value, settings.windUnit, t)}</dd>
                      </div>
                      <div>
                        <dt className="label">{t.days.sun}</dt>
                        <dd style={{ fontSize: 13, lineHeight: '18px' }}>
                          ↑ {fmt.clock(d.sunrise)}
                          <br />↓ {fmt.clock(d.sunset)}
                        </dd>
                      </div>
                    </dl>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}

import { Loader } from '../components/Loader'
import { PixelIcon } from '../components/PixelIcon'
import { SectionTitle } from '../components/SectionTitle'
import { shownForecast } from '../hooks/useForecast'
import { placeName, useI18n } from '../i18n'
import { useNow } from '../hooks/useNow'
import type { LocationState } from '../hooks/useLocation'
import * as fmt from '../lib/format'
import { daySummary } from '../lib/summary'
import { toLocalIso } from '../lib/time'
import { useAppState } from '../state/context'
import type { ConsensusForecast, ForecastState } from '../types/weather'

interface Props {
  location: LocationState
  forecast: ForecastState
  onRetryLocation: () => void
  onRetryForecast: () => void
  onOpenCities: () => void
  onOpenDays: () => void
}

const ART_GPS = [
  '      .-""-.',
  '     /  __  \\',
  '    |  (__)  |',
  '     \\      /',
  '      \\    /',
  '       \\  /',
  '        \\/',
  '   ?  ~~~~~~  ?',
].join('\n')

const ART_ERROR = ['        .--.', '     .-(    ).', '    (  x    x )', "     `-.____.-'", '      /  /  /'].join('\n')

export function NowScreen(props: Props) {
  const { location, forecast } = props
  const { selected } = useAppState()
  const { t } = useI18n()
  // Ignora a previsão de outro lugar enquanto a nova seleção carrega. Com o GPS ainda
  // localizando, a última previsão dele já vale.
  const shown = shownForecast(forecast)
  const selectedId = selected === 'gps' ? 'gps' : selected.id
  const data = location.status !== 'denied' && location.status !== 'unavailable' && shown?.location.id === selectedId ? shown : null

  let body
  let title = location.status === 'ready' ? placeName(location.location, t) : t.now.loading
  if (location.status === 'denied' || location.status === 'unavailable') {
    title = t.now.noLocation
    body = <LocationProblem denied={location.status === 'denied'} {...props} />
  } else if (forecast.status === 'error' && location.status === 'ready') {
    body = <ErrorState offline={forecast.reason === 'offline'} onRetry={props.onRetryForecast} />
  } else if (!data) {
    const stage = location.status === 'loading' ? 'locating' : 'fetching'
    body = <Loader key={stage} stage={stage} />
  } else {
    title = placeName(data.location, t)
    body = <Weather data={data} staleSince={forecast.status === 'stale' ? data.generatedAt : null} {...props} />
  }

  return (
    <main className="screen">
      <Header title={title} timezone={data?.location.timezone} onOpenCities={props.onOpenCities} />
      {body}
    </main>
  )
}

function Header({ title, timezone, onOpenCities }: { title: string; timezone?: string; onOpenCities: () => void }) {
  const { t } = useI18n()
  const now = useNow()
  const local = toLocalIso(now, timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
  return (
    <div className="topbar">
      <button type="button" className="topbar__link" onClick={onOpenCities} aria-label={t.now.changeCity(title)}>
        {title}
        <span aria-hidden="true" style={{ fontWeight: 400 }}>
          ↓
        </span>
      </button>
      <span className="topbar__meta">{fmt.headerDate(local, t)}</span>
    </div>
  )
}

function Weather({ data, staleSince, onOpenDays }: Props & { data: ConsensusForecast; staleSince: string | null }) {
  const { settings } = useAppState()
  const { t } = useI18n()
  const { current } = data
  const today = data.daily[0]
  const unit = settings.temperatureUnit

  const spec: [string, string][] = [
    [t.now.humidity, fmt.percent(current.humidity?.value)],
    [t.now.wind, `${fmt.windSpeed(current.windSpeed?.value, settings.windUnit, t)} ${fmt.windDirection(current.windDirection, t)}`],
    [t.now.rain, fmt.millimeters(today?.precipitationSum?.value, t)],
    [t.now.sun, `↑${fmt.clock(today?.sunrise)} ↓${fmt.clock(today?.sunset)}`],
  ]

  return (
    <>
      {staleSince && (
        <div className="now__offline">
          <span className="now__offline-dot dither" aria-hidden="true" />
          {t.now.offline(fmt.clock(toLocalIso(new Date(staleSince), data.location.timezone)))}
        </div>
      )}

      <section className="now__hero" aria-label={t.now.region}>
        <PixelIcon glyph={fmt.glyphFor(current.condition?.value, current.isDay)} size={112} accent />
        <div className="now__temp-row">
          <div className="now__temp accent">{fmt.temperature(current.temperature?.value, unit)}</div>
          <div className="now__range">
            <span>
              <span className="muted">{t.now.high} </span>
              <b>{fmt.temperature(today?.temperatureMax?.value, unit)}</b>
            </span>
            <span>
              <span className="muted">{t.now.low} </span>
              <b>{fmt.temperature(today?.temperatureMin?.value, unit)}</b>
            </span>
          </div>
        </div>
        <div className="now__condition">
          {t.conditions[current.condition?.value ?? 'cloudy']}
          <span> • {t.now.feelsLike(fmt.temperature(current.apparentTemperature?.value ?? current.temperature?.value, unit))}</span>
        </div>
        <p className="now__summary">
          &gt; {daySummary(data, t)}
          <span className="cursor" aria-hidden="true" />
        </p>
      </section>

      <SectionTitle>{t.now.details}</SectionTitle>
      <dl className="spec">
        {spec.map(([k, v]) => (
          <div className="spec__cell" key={k}>
            <dt className="label">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="hours-head">
        <SectionTitle as="div">{t.now.next24h}</SectionTitle>
        <button type="button" onClick={onOpenDays}>
          <span className="pill">{t.now.sevenDays}</span>
        </button>
      </div>
      <ol className="hours" aria-label={t.now.next24hLabel}>
        {data.hourly.slice(0, 24).map((h, i) => (
          <li key={h.time}>
            <span className="hours__time">{i === 0 ? t.now.nowHour : fmt.hourLabel(h.time, t)}</span>
            <PixelIcon glyph={fmt.glyphFor(h.condition?.value, h.isDay)} accent={i === 0} />
            <span className="hours__temp">{fmt.temperature(h.temperature?.value, unit)}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

function LocationProblem({ denied, onOpenCities, onRetryLocation }: Props & { denied: boolean }) {
  const { t } = useI18n()
  return (
    <div className="state">
      <pre className="state__art accent" aria-hidden="true">
        {ART_GPS}
      </pre>
      <h1 className="state__title">-=&lt; {t.now.noLocationTitle} &gt;=-</h1>
      <p className="state__text muted">
        {denied ? t.now.gpsDenied : t.now.gpsUnavailable}
      </p>
      <div className="state__actions">
        <button type="button" className="btn" onClick={onOpenCities}>
          {t.now.searchCity}
          <span aria-hidden="true">→</span>
        </button>
        {!denied && (
          <button type="button" className="btn btn--ghost" onClick={onRetryLocation}>
            {t.now.tryAgain}
          </button>
        )}
      </div>
    </div>
  )
}

function ErrorState({ offline, onRetry }: { offline: boolean; onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="state">
      <pre className="state__art" aria-hidden="true">
        {ART_ERROR}
      </pre>
      <h1 className="state__title accent">
        <span className="state__square" aria-hidden="true" />
        -=&lt; {t.now.error} &gt;=-
      </h1>
      <p className="state__text" style={{ fontSize: 17, fontWeight: 500 }}>
        {t.now.errorText}
      </p>
      <p className="state__text muted" style={{ fontSize: 13 }}>
        {offline ? t.now.errorOffline : t.now.errorLater}
      </p>
      <div className="state__actions">
        <button type="button" className="btn" onClick={onRetry}>
          {t.now.tryAgain}
          <span aria-hidden="true">↻</span>
        </button>
      </div>
    </div>
  )
}

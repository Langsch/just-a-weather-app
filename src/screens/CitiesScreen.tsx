import { useEffect, useState } from 'react'
import { searchCities } from '../api/geocoding'
import { PixelIcon } from '../components/PixelIcon'
import { SectionTitle } from '../components/SectionTitle'
import { useBrief } from '../hooks/useBrief'
import { useNow } from '../hooks/useNow'
import { useI18n } from '../i18n'
import * as fmt from '../lib/format'
import { toLocalIso } from '../lib/time'
import { loadForecast } from '../storage/forecastCache'
import { useAppState } from '../state/context'
import type { Location } from '../types/location'
import type { ConsensusForecast } from '../types/weather'

const SEARCH_DELAY_MS = 300

/** Caixa ASCII com o texto centralizado em 18 colunas. */
function emptyArt(text: string): string {
  const inner = text.padStart(Math.ceil((18 + text.length) / 2)).padEnd(18)
  return ['┌──────────────────┐', '│                  │', `│${inner}│`, '│                  │', '└──────────────────┘'].join('\n')
}

type Search =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; results: Location[] }
  | { status: 'error' }

export function CitiesScreen({ onPick }: { onPick: (location: Location | 'gps') => void }) {
  const { favorites, toggleFavorite, isFavorite } = useAppState()
  const { lang, t } = useI18n()
  const [query, setQuery] = useState('')
  // Resultado marcado com a busca que o produziu; texto diferente = ainda buscando.
  const [result, setResult] = useState<{ query: string; search: Search } | null>(null)
  const trimmed = query.trim()
  const searching = trimmed.length >= 2
  const search: Search = !searching
    ? { status: 'idle' }
    : result?.query === trimmed
      ? result.search
      : { status: 'loading' }

  useEffect(() => {
    if (!searching) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchCities(trimmed, lang, controller.signal)
        .then((results) => setResult({ query: trimmed, search: { status: 'done', results } }))
        .catch(() => !controller.signal.aborted && setResult({ query: trimmed, search: { status: 'error' } }))
    }, SEARCH_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed, searching, lang])

  const count = searching
    ? search.status === 'done'
      ? t.cities.results(search.results.length)
      : t.cities.searching
    : t.cities.favoritesCount(favorites.length)

  return (
    <main className="screen">
      <div className="topbar">
        <h1 className="page-title">{t.cities.title}</h1>
        <span className="topbar__meta">{count}</span>
      </div>

      <label htmlFor="busca-cidade" className="label" style={{ marginTop: 12 }}>
        {t.cities.searchLabel}
      </label>
      <div className="search">
        <span className="search__prompt" aria-hidden="true">
          &gt;
        </span>
        <input
          id="busca-cidade"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.cities.placeholder}
          autoComplete="off"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className="icon-btn" aria-label={t.cities.clear} onClick={() => setQuery('')}>
            ×
          </button>
        )}
      </div>

      {!searching && (
        <>
          <HomeCard onPick={() => onPick('gps')} />
          {favorites.length > 0 ? (
            <>
              <SectionTitle>{t.cities.favorites}</SectionTitle>
              <ul className="rows">
                {favorites.map((city) => (
                  <FavoriteRow key={city.id} city={city} onPick={() => onPick(city)} onRemove={() => toggleFavorite(city)} />
                ))}
              </ul>
            </>
          ) : (
            <div className="empty">
              <pre className="state__art accent" aria-hidden="true">
                {emptyArt(t.cities.emptyArt)}
              </pre>
              <p className="state__text" style={{ fontWeight: 500 }}>
                {t.cities.empty}
              </p>
              <p className="state__text muted" style={{ fontSize: 13 }}>
                {t.cities.emptyHint}
              </p>
            </div>
          )}
        </>
      )}

      {searching && search.status === 'done' && search.results.length > 0 && (
        <>
          <SectionTitle>{t.cities.resultsTitle}</SectionTitle>
          <ul className="rows">
            {search.results.map((city) => {
              const fav = isFavorite(city.id)
              return (
                <li className="row" key={city.id}>
                  <button type="button" className="row__main" onClick={() => onPick(city)}>
                    <span className="row__text">
                      <span>{city.name}</span>
                      <span>{[city.region, city.country].filter(Boolean).join(', ')}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-pressed={fav}
                    aria-label={fav ? t.cities.unfavorite(city.name) : t.cities.favorite(city.name)}
                    onClick={() => toggleFavorite(city)}
                    style={{ fontSize: 20 }}
                  >
                    {fav ? '★' : '☆'}
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {searching && (search.status === 'error' || (search.status === 'done' && search.results.length === 0)) && (
        <div className="empty">
          <pre className="loader__log">
            {[
              t.cities.searchCommand(query.trim()),
              search.status === 'error' ? t.cities.connectionError : t.cities.zeroResults,
              '$ _',
            ].join('\n')}
          </pre>
          <p className="state__text" style={{ fontWeight: 500 }}>
            {search.status === 'error' ? t.cities.searchFailed : t.cities.notFound}
          </p>
          <p className="state__text muted" style={{ fontSize: 13 }}>
            {search.status === 'error' ? t.cities.searchFailedHint : t.cities.notFoundHint}
          </p>
        </div>
      )}
    </main>
  )
}

function HomeCard({ onPick }: { onPick: () => void }) {
  const { settings } = useAppState()
  const { t } = useI18n()
  // Mostra a última previsão do GPS, se houver; não pede a posição só para a lista.
  const [last, setLast] = useState<ConsensusForecast | null>(null)
  useEffect(() => {
    loadForecast('gps').then(setLast)
  }, [])
  const current = last?.current
  return (
    <button type="button" className="home-card" onClick={onPick}>
      <PixelIcon glyph="nav-cidades" size={16} decorative />
      <span className="home-card__text">
        <b>{t.cities.myLocation}</b>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{t.cities.useGps}</span>
      </span>
      {current?.temperature && (
        <>
          <PixelIcon glyph={fmt.glyphFor(current.condition?.value, current.isDay)} />
          <span className="home-card__temp">{fmt.temperature(current.temperature.value, settings.temperatureUnit)}</span>
        </>
      )}
    </button>
  )
}

function FavoriteRow({ city, onPick, onRemove }: { city: Location; onPick: () => void; onRemove: () => void }) {
  const { settings } = useAppState()
  const { t } = useI18n()
  const brief = useBrief(city)
  const now = useNow()
  return (
    <li className="row">
      <button type="button" className="row__main" onClick={onPick}>
        <span className="row__text">
          <span>{city.name}</span>
          <span>
            {city.region ?? city.country} • {fmt.clock(toLocalIso(now, city.timezone))}
          </span>
        </span>
        {brief && (
          <>
            <PixelIcon glyph={fmt.glyphFor(brief.condition, brief.isDay)} />
            <span className="row__temp">{fmt.temperature(brief.temperature, settings.temperatureUnit)}</span>
          </>
        )}
      </button>
      <button type="button" className="icon-btn" aria-label={t.cities.remove(city.name)} onClick={onRemove}>
        ×
      </button>
    </li>
  )
}

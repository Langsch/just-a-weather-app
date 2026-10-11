import { useCallback, useEffect, useState } from 'react'
import { getForecast } from '../api/forecast'
import { NoSourcesError } from '../consensus/consensus'
import { loadForecast, saveForecast } from '../storage/forecastCache'
import type { Location } from '../types/location'
import type { ConsensusForecast, ForecastErrorReason, ForecastState } from '../types/weather'

function reasonFor(error: unknown): ForecastErrorReason {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline'
  if (error instanceof NoSourcesError) return 'all-sources-failed'
  return 'offline'
}

/**
 * Mostra o cache na hora (se houver) e busca a previsão nova em seguida.
 * Falhou e há cache → `stale`; falhou sem cache → `error`.
 * Sem `location` ainda (GPS localizando), mostra o cache de `pendingId` e espera.
 */
export function useForecast(location: Location | null, pendingId: string | null = null) {
  const [state, setState] = useState<ForecastState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const id = location?.id ?? pendingId
    if (!id) return
    const controller = new AbortController()

    async function run(id: string, target: Location | null) {
      const cached = await loadForecast(id)
      if (controller.signal.aborted) return
      setState({ status: 'loading', previous: cached ?? undefined })
      if (!target) return
      try {
        const forecast = await getForecast(target, undefined, controller.signal)
        if (controller.signal.aborted) return
        setState({ status: 'ready', forecast })
        saveForecast(forecast)
      } catch (error) {
        if (controller.signal.aborted) return
        const reason = reasonFor(error)
        setState(cached ? { status: 'stale', forecast: cached, reason } : { status: 'error', reason })
      }
    }

    run(id, location)
    return () => controller.abort()
  }, [location, pendingId, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}

/** A previsão a exibir, inclusive a anterior enquanto atualiza. */
export function shownForecast(state: ForecastState): ConsensusForecast | null {
  if (state.status === 'ready' || state.status === 'stale') return state.forecast
  if (state.status === 'loading') return state.previous ?? null
  return null
}

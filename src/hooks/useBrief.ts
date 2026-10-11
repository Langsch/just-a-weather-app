import { useEffect, useState } from 'react'
import { fetchBrief, type Brief } from '../api/openMeteo'
import { loadForecast } from '../storage/forecastCache'
import type { Location } from '../types/location'

const FRESH_MS = 60 * 60 * 1000

/** Temperatura e condição atuais para listas: usa o consenso salvo se for recente. */
export function useBrief(location: Location | null): Brief | null {
  const [brief, setBrief] = useState<Brief | null>(null)

  useEffect(() => {
    if (!location) return
    const controller = new AbortController()
    ;(async () => {
      const cached = await loadForecast(location.id)
      if (cached && Date.now() - Date.parse(cached.generatedAt) < FRESH_MS && cached.current.temperature) {
        const { current } = cached
        setBrief({ temperature: current.temperature!.value, condition: current.condition?.value ?? null, isDay: current.isDay })
        return
      }
      try {
        setBrief(await fetchBrief(location, controller.signal))
      } catch {
        // Lista sem temperatura é aceitável; nada a mostrar.
      }
    })()
    return () => controller.abort()
  }, [location])

  return brief
}

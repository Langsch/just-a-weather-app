import { Geolocation } from '@capacitor/geolocation'
import { useCallback, useEffect, useState } from 'react'
import type { Location } from '../types/location'

export type LocationState =
  | { status: 'loading' }
  | { status: 'ready'; location: Location }
  | { status: 'denied' }
  | { status: 'unavailable' }

/** Posição do GPS como Location. O fuso é o do aparelho, já que o usuário está lá. */
async function currentLocation(): Promise<Location> {
  // Para previsão do tempo uma posição de até 30 min basta, e costuma sair na hora.
  const { coords } = await Geolocation.getCurrentPosition({
    enableHighAccuracy: false,
    maximumAge: 30 * 60_000,
    timeout: 10_000,
  })
  return {
    id: 'gps',
    // Exibido como "My location" / "Minha localização" (ver placeName).
    name: '',
    country: '',
    latitude: Math.round(coords.latitude * 1e4) / 1e4,
    longitude: Math.round(coords.longitude * 1e4) / 1e4,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

function isDenied(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { code, message } = error as { code?: unknown; message?: unknown }
  // Navegador: GeolocationPositionError.PERMISSION_DENIED = 1. Nativo: mensagem.
  return code === 1 || (typeof message === 'string' && /denied|permission/i.test(message))
}

/** Resolve a seleção atual (cidade ou GPS) em uma Location. */
export function useLocation(selected: Location | 'gps') {
  const [attempt, setAttempt] = useState(0)
  // Resultado do GPS marcado com a tentativa que o produziu; outra tentativa = carregando.
  const [gps, setGps] = useState<{ attempt: number; state: LocationState } | null>(null)
  const usingGps = selected === 'gps'

  useEffect(() => {
    if (!usingGps) return
    let cancelled = false
    currentLocation()
      .then((location) => !cancelled && setGps({ attempt, state: { status: 'ready', location } }))
      .catch(
        (error) =>
          !cancelled && setGps({ attempt, state: { status: isDenied(error) ? 'denied' : 'unavailable' } }),
      )
    return () => {
      cancelled = true
    }
  }, [usingGps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  let state: LocationState
  if (!usingGps) state = { status: 'ready', location: selected }
  else if (gps && gps.attempt === attempt) state = gps.state
  else state = { status: 'loading' }

  return { state, retry }
}

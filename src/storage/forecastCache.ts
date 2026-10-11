import { Preferences } from '@capacitor/preferences'
import type { ConsensusForecast } from '../types/weather'

/*
 * Último resultado por localização, para abrir o app instantaneamente e para o modo
 * offline (estado `stale`). No navegador o Preferences usa localStorage; no Android,
 * SharedPreferences.
 */

const key = (locationId: string) => `forecast:${locationId}`

export async function saveForecast(forecast: ConsensusForecast): Promise<void> {
  await Preferences.set({ key: key(forecast.location.id), value: JSON.stringify(forecast) })
}

export async function loadForecast(locationId: string): Promise<ConsensusForecast | null> {
  const { value } = await Preferences.get({ key: key(locationId) })
  if (!value) return null
  try {
    return JSON.parse(value) as ConsensusForecast
  } catch {
    return null
  }
}

import type { Location } from '../types/location'
import type { Language } from '../types/settings'
import { fetchWithTimeout } from '../lib/http'

const BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search'

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  timezone: string
  country?: string
  country_code?: string
  admin1?: string
}

export interface GeocodingResponse {
  /** Ausente quando nada é encontrado. */
  results?: GeocodingResult[]
}

export function parseGeocoding(json: GeocodingResponse): Location[] {
  return (json.results ?? []).map((result) => ({
    id: String(result.id),
    name: result.name,
    region: result.admin1,
    country: result.country ?? result.country_code ?? '',
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  }))
}

/** Busca por nome; os nomes vêm no idioma da interface ("Tokyo" / "Tóquio"). */
export async function searchCities(query: string, language: Language, signal?: AbortSignal): Promise<Location[]> {
  const name = query.trim()
  if (name.length < 2) return []
  const params = new URLSearchParams({ name, count: '10', language })
  const response = await fetchWithTimeout(`${BASE_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(`Geocoding respondeu ${response.status}`)
  return parseGeocoding(await response.json())
}

import type { Location } from '../types/location'
import geocodingRio from '../api/__fixtures__/geocoding-rio.json'
import metnoRio from '../api/__fixtures__/metno-rio.json'
import openMeteoRio from '../api/__fixtures__/open-meteo-rio.json'
import type { GeocodingResponse } from '../api/geocoding'
import type { MetnoResponse } from '../api/metno'
import type { OpenMeteoResponse } from '../api/openMeteo'

/** Respostas reais para o Rio de Janeiro, baixadas em 10/10/2026 por volta das 19:25 locais. */
export const openMeteoFixture = openMeteoRio as unknown as OpenMeteoResponse
export const metnoFixture = metnoRio as unknown as MetnoResponse
export const geocodingFixture = geocodingRio as unknown as GeocodingResponse

/** Instante logo após o download das fixtures (19:30 em São Paulo). */
export const FIXTURE_NOW = new Date('2026-10-10T22:30:00Z')

export const RIO: Location = {
  id: '3451190',
  name: 'Rio de Janeiro',
  region: 'Rio de Janeiro',
  country: 'Brasil',
  latitude: -22.9064,
  longitude: -43.1822,
  timezone: 'America/Sao_Paulo',
}

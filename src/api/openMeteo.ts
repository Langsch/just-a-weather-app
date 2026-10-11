import type { Location } from '../types/location'
import type { Condition, DailyPoint, HourlyPoint, SourceId, SourceResult } from '../types/weather'
import { fromWmoCode } from './conditions'
import { OPEN_METEO_MODELS } from './sources'
import { fetchWithTimeout } from '../lib/http'

const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'precipitation_probability',
  'relative_humidity_2m',
  'wind_speed_10m',
  'wind_direction_10m',
  'weather_code',
] as const

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
] as const

/** Com `models=`, cada variável vem com o sufixo do modelo: `temperature_2m_gfs_seamless`. */
type Columns = { time: string[] } & Record<string, (number | string | null)[] | undefined>

export interface OpenMeteoResponse {
  hourly: Columns
  daily: Columns
}

export function isOpenMeteoSource(source: SourceId): boolean {
  return source in OPEN_METEO_MODELS
}

export function buildOpenMeteoUrl(location: Location, sources: SourceId[]): string {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: HOURLY_VARS.join(','),
    daily: DAILY_VARS.join(','),
    models: sources.map((source) => OPEN_METEO_MODELS[source]).join(','),
    timezone: location.timezone,
    forecast_days: '7',
  })
  return `${BASE_URL}?${params}`
}

function column<T>(columns: Columns, variable: string, model: string): (T | null)[] {
  return (columns[`${variable}_${model}`] as (T | null)[] | undefined) ?? []
}

export function parseOpenMeteo(
  json: OpenMeteoResponse,
  sources: SourceId[],
  fetchedAt: string,
): SourceResult[] {
  return sources.map((source): SourceResult => {
    const model = OPEN_METEO_MODELS[source]!
    const h = (variable: string) => column<number>(json.hourly, variable, model)
    const d = (variable: string) => column<number>(json.daily, variable, model)

    const temperature = h('temperature_2m')
    const apparent = h('apparent_temperature')
    const precipitation = h('precipitation')
    const precipitationProbability = h('precipitation_probability')
    const humidity = h('relative_humidity_2m')
    const windSpeed = h('wind_speed_10m')
    const windDirection = h('wind_direction_10m')
    const weatherCode = h('weather_code')

    // Pontos sem temperatura estão fora do horizonte do modelo: não entram.
    const hourly: HourlyPoint[] = []
    json.hourly.time.forEach((time, i) => {
      if (temperature[i] == null) return
      hourly.push({
        time,
        temperature: temperature[i],
        apparentTemperature: apparent[i] ?? null,
        precipitation: precipitation[i] ?? null,
        precipitationProbability: precipitationProbability[i] ?? null,
        humidity: humidity[i] ?? null,
        windSpeed: windSpeed[i] ?? null,
        windDirection: windDirection[i] ?? null,
        condition: fromWmoCode(weatherCode[i] ?? null),
      })
    })

    if (hourly.length === 0) {
      return { source, status: 'error', error: 'Sem dados para esta região' }
    }

    const tempMax = d('temperature_2m_max')
    const tempMin = d('temperature_2m_min')
    const precipitationSum = d('precipitation_sum')
    const precipitationProbabilityMax = d('precipitation_probability_max')
    const windSpeedMax = d('wind_speed_10m_max')
    const dailyCode = d('weather_code')
    const sunrise = column<string>(json.daily, 'sunrise', model)
    const sunset = column<string>(json.daily, 'sunset', model)

    const daily: DailyPoint[] = []
    json.daily.time.forEach((date, i) => {
      if (tempMax[i] == null) return
      daily.push({
        date,
        temperatureMax: tempMax[i],
        temperatureMin: tempMin[i] ?? null,
        precipitationSum: precipitationSum[i] ?? null,
        precipitationProbabilityMax: precipitationProbabilityMax[i] ?? null,
        windSpeedMax: windSpeedMax[i] ?? null,
        condition: fromWmoCode(dailyCode[i] ?? null),
        sunrise: sunrise[i] ?? null,
        sunset: sunset[i] ?? null,
      })
    })

    return { source, status: 'ok', forecast: { source, fetchedAt, hourly, daily } }
  })
}

export async function fetchOpenMeteo(
  location: Location,
  sources: SourceId[],
  signal?: AbortSignal,
): Promise<SourceResult[]> {
  if (sources.length === 0) return []
  try {
    const response = await fetchWithTimeout(buildOpenMeteoUrl(location, sources), { signal })
    if (!response.ok) throw new Error(`Open-Meteo respondeu ${response.status}`)
    return parseOpenMeteo(await response.json(), sources, new Date().toISOString())
  } catch (error) {
    if (signal?.aborted) throw error
    const message = error instanceof Error ? error.message : String(error)
    return sources.map((source) => ({ source, status: 'error', error: message }))
  }
}

export interface Brief {
  temperature: number
  condition: Condition | null
  isDay: boolean
}

/** Só o "agora" do modelo padrão: uma chamada barata para listas (ex.: favoritas). */
export async function fetchBrief(location: Location, signal?: AbortSignal): Promise<Brief> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code,is_day',
    timezone: location.timezone,
  })
  const response = await fetchWithTimeout(`${BASE_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(`Open-Meteo respondeu ${response.status}`)
  const { current } = await response.json()
  return {
    temperature: current.temperature_2m,
    condition: fromWmoCode(current.weather_code ?? null),
    isDay: current.is_day === 1,
  }
}

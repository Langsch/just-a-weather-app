import { Capacitor } from '@capacitor/core'
import type { Location } from '../types/location'
import type { Condition, DailyPoint, HourlyPoint, SourceResult } from '../types/weather'
import { datePart, toLocalIso } from '../lib/time'
import { fromMetnoSymbol, mostSevere } from './conditions'
import { fetchWithTimeout } from '../lib/http'

/*
 * MET Norway Locationforecast 2.0 (compact).
 * - Horários em UTC; passo de 1 h nas primeiras ~60 h e de 6 h depois.
 * - Não fornece sensação térmica nem probabilidade de chuva no formato compact.
 * - Os termos pedem um User-Agent identificando o app e um contato. No navegador não dá
 *   para defini-lo (e o header extra quebraria o CORS); no app nativo o fetch passa pelo
 *   CapacitorHttp, que envia o nosso.
 */

const USER_AGENT = `just-a-weather-app/${__APP_VERSION__} github.com/Langsch`

const BASE_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'

interface Period {
  summary?: { symbol_code?: string }
  details?: { precipitation_amount?: number }
}

interface MetnoEntry {
  time: string
  data: {
    instant: {
      details: {
        air_temperature?: number
        relative_humidity?: number
        wind_speed?: number // m/s
        wind_from_direction?: number
      }
    }
    next_1_hours?: Period
    next_6_hours?: Period
  }
}

export interface MetnoResponse {
  properties: { timeseries: MetnoEntry[] }
}

const HOUR_MS = 3_600_000

/** Um dia só entra no resumo se os dados cobrirem da madrugada à noite. */
const DAY_START_MAX = '03:00'
const DAY_END_MIN = '21:00'

export function buildMetnoUrl(location: Location): string {
  // A API pede no máximo 4 casas decimais.
  const lat = location.latitude.toFixed(4)
  const lon = location.longitude.toFixed(4)
  return `${BASE_URL}?lat=${lat}&lon=${lon}`
}

interface DayAccumulator {
  times: string[]
  temperatures: number[]
  windSpeeds: number[]
  precipitation: number
  conditions: Condition[]
}

export function parseMetno(json: MetnoResponse, timeZone: string, fetchedAt: string): SourceResult {
  const series = json.properties.timeseries
  const hourly: HourlyPoint[] = []
  const days = new Map<string, DayAccumulator>()

  series.forEach((entry, i) => {
    const { instant, next_1_hours: next1, next_6_hours: next6 } = entry.data
    const details = instant.details
    if (details.air_temperature === undefined) return

    const time = toLocalIso(new Date(entry.time), timeZone)
    const windSpeed = details.wind_speed !== undefined ? details.wind_speed * 3.6 : null
    const condition = fromMetnoSymbol(next1?.summary?.symbol_code)

    hourly.push({
      time,
      temperature: details.air_temperature,
      apparentTemperature: null,
      precipitation: next1?.details?.precipitation_amount ?? null,
      precipitationProbability: null,
      humidity: details.relative_humidity ?? null,
      windSpeed,
      windDirection: details.wind_from_direction ?? null,
      condition,
    })

    const date = datePart(time)
    let day = days.get(date)
    if (!day) {
      day = { times: [], temperatures: [], windSpeeds: [], precipitation: 0, conditions: [] }
      days.set(date, day)
    }
    day.times.push(time.slice(11))
    day.temperatures.push(details.air_temperature)
    if (windSpeed !== null) day.windSpeeds.push(windSpeed)

    // Chuva do intervalo até o próximo ponto: 1 h usa next_1_hours, passos maiores usam
    // a fração correspondente de next_6_hours.
    const next = series[i + 1]
    const gapHours = next ? (Date.parse(next.time) - Date.parse(entry.time)) / HOUR_MS : 1
    if (gapHours <= 1 && next1?.details?.precipitation_amount !== undefined) {
      day.precipitation += next1.details.precipitation_amount
    } else if (next6?.details?.precipitation_amount !== undefined) {
      day.precipitation += (next6.details.precipitation_amount * Math.min(gapHours, 6)) / 6
    }

    const periodCondition = gapHours <= 1 ? condition : fromMetnoSymbol(next6?.summary?.symbol_code)
    if (periodCondition) day.conditions.push(periodCondition)
  })

  if (hourly.length === 0) {
    return { source: 'metno', status: 'error', error: 'Resposta sem dados' }
  }

  const daily: DailyPoint[] = []
  for (const [date, day] of days) {
    const covered = day.times[0] <= DAY_START_MAX && day.times[day.times.length - 1] >= DAY_END_MIN
    if (!covered) continue
    daily.push({
      date,
      temperatureMax: Math.max(...day.temperatures),
      temperatureMin: Math.min(...day.temperatures),
      precipitationSum: Math.round(day.precipitation * 10) / 10,
      precipitationProbabilityMax: null,
      windSpeedMax: day.windSpeeds.length > 0 ? Math.max(...day.windSpeeds) : null,
      condition: mostSevere(day.conditions),
      sunrise: null,
      sunset: null,
    })
  }

  return { source: 'metno', status: 'ok', forecast: { source: 'metno', fetchedAt, hourly, daily } }
}

export async function fetchMetno(location: Location, signal?: AbortSignal): Promise<SourceResult> {
  try {
    const headers = Capacitor.isNativePlatform() ? { 'User-Agent': USER_AGENT } : undefined
    const response = await fetchWithTimeout(buildMetnoUrl(location), { signal, headers })
    if (!response.ok) throw new Error(`MET Norway respondeu ${response.status}`)
    return parseMetno(await response.json(), location.timezone, new Date().toISOString())
  } catch (error) {
    if (signal?.aborted) throw error
    const message = error instanceof Error ? error.message : String(error)
    return { source: 'metno', status: 'error', error: message }
  }
}

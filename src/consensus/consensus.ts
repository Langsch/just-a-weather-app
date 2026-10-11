import type { Location } from '../types/location'
import type {
  Condition,
  ConsensusCondition,
  ConsensusDay,
  ConsensusForecast,
  ConsensusHour,
  ConsensusValue,
  DailyPoint,
  HourlyPoint,
  SourceForecast,
  SourceId,
  SourceResult,
} from '../types/weather'
import { SEVERITY } from '../api/conditions'
import { datePart, floorToHour, toLocalIso } from '../lib/time'

const HOURLY_COUNT = 48
const DAILY_COUNT = 7

/**
 * Spread (max − min) a partir do qual a concordância começa a cair (`high`)
 * e em que chega a zero (`low`), nas unidades do contrato.
 */
const TOLERANCE = {
  temperature: { high: 1, low: 5 }, // °C
  precipitation: { high: 0.5, low: 5 }, // mm
  precipitationSum: { high: 2, low: 20 }, // mm/dia
  probability: { high: 10, low: 40 }, // pontos percentuais
  humidity: { high: 10, low: 30 }, // pontos percentuais
  wind: { high: 5, low: 20 }, // km/h
} as const

type Tolerance = { high: number; low: number }

// ───────────────────────────── estatística ─────────────────────────────

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** 1 fonte → 0,5 · 2 → 0,75 · 3 → 0,875 … Mais fontes concordando pesam mais. */
function coverage(sourceCount: number): number {
  return 1 - 0.5 ** sourceCount
}

function agreement(spread: number, tolerance: Tolerance): number {
  if (spread <= tolerance.high) return 1
  if (spread >= tolerance.low) return 0
  return 1 - (spread - tolerance.high) / (tolerance.low - tolerance.high)
}

const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits

export function combineValues(
  bySource: Partial<Record<SourceId, number>>,
  tolerance: Tolerance,
): ConsensusValue | null {
  const values = Object.values(bySource) as number[]
  if (values.length === 0) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min
  return {
    value: round(median(values)),
    min,
    max,
    spread: round(spread),
    sourceCount: values.length,
    confidence: round(agreement(spread, tolerance) * coverage(values.length), 2),
    bySource,
  }
}

export function combineConditions(
  bySource: Partial<Record<SourceId, Condition>>,
): ConsensusCondition | null {
  const votes = Object.values(bySource) as Condition[]
  if (votes.length === 0) return null
  const counts = new Map<Condition, number>()
  for (const vote of votes) counts.set(vote, (counts.get(vote) ?? 0) + 1)

  let winner = votes[0]
  for (const [condition, count] of counts) {
    const best = counts.get(winner)!
    if (count > best || (count === best && SEVERITY.indexOf(condition) > SEVERITY.indexOf(winner))) {
      winner = condition
    }
  }
  return { value: winner, agreement: round(counts.get(winner)! / votes.length, 2), bySource }
}

/** Média circular: 350° e 10° dão 0°, não 180°. */
function circularMean(degrees: number[]): number | null {
  if (degrees.length === 0) return null
  let x = 0
  let y = 0
  for (const deg of degrees) {
    x += Math.cos((deg * Math.PI) / 180)
    y += Math.sin((deg * Math.PI) / 180)
  }
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360)
}

// ───────────────────────────── alinhamento ─────────────────────────────

/** Para cada horário/data, os pontos de cada fonte que o têm. */
function indexBy<T>(
  forecasts: SourceForecast[],
  points: (forecast: SourceForecast) => T[],
  key: (point: T) => string,
): Map<string, Map<SourceId, T>> {
  const index = new Map<string, Map<SourceId, T>>()
  for (const forecast of forecasts) {
    for (const point of points(forecast)) {
      const k = key(point)
      let bySource = index.get(k)
      if (!bySource) index.set(k, (bySource = new Map()))
      bySource.set(forecast.source, point)
    }
  }
  return index
}

function pick<T, V>(points: Map<SourceId, T>, field: (point: T) => V | null) {
  const bySource: Partial<Record<SourceId, V>> = {}
  for (const [source, point] of points) {
    const value = field(point)
    if (value !== null) bySource[source] = value
  }
  return bySource
}

function combineHour(
  time: string,
  points: Map<SourceId, HourlyPoint>,
  sun: Map<string, { sunrise: string | null; sunset: string | null }>,
): ConsensusHour {
  const day = sun.get(datePart(time))
  const hour = time.slice(11)
  const isDay =
    day?.sunrise && day.sunset
      ? time >= floorToHour(day.sunrise) && time < day.sunset
      : hour >= '06:00' && hour < '18:00'

  return {
    time,
    isDay,
    temperature: combineValues(pick(points, (p) => p.temperature), TOLERANCE.temperature),
    apparentTemperature: combineValues(pick(points, (p) => p.apparentTemperature), TOLERANCE.temperature),
    precipitation: combineValues(pick(points, (p) => p.precipitation), TOLERANCE.precipitation),
    precipitationProbability: combineValues(
      pick(points, (p) => p.precipitationProbability),
      TOLERANCE.probability,
    ),
    humidity: combineValues(pick(points, (p) => p.humidity), TOLERANCE.humidity),
    windSpeed: combineValues(pick(points, (p) => p.windSpeed), TOLERANCE.wind),
    windDirection: circularMean(Object.values(pick(points, (p) => p.windDirection)) as number[]),
    condition: combineConditions(pick(points, (p) => p.condition)),
  }
}

function combineDay(date: string, points: Map<SourceId, DailyPoint>): ConsensusDay {
  const first = <V>(field: (p: DailyPoint) => V | null): V | null => {
    for (const point of points.values()) {
      const value = field(point)
      if (value !== null) return value
    }
    return null
  }
  return {
    date,
    temperatureMax: combineValues(pick(points, (p) => p.temperatureMax), TOLERANCE.temperature),
    temperatureMin: combineValues(pick(points, (p) => p.temperatureMin), TOLERANCE.temperature),
    precipitationSum: combineValues(pick(points, (p) => p.precipitationSum), TOLERANCE.precipitationSum),
    precipitationProbabilityMax: combineValues(
      pick(points, (p) => p.precipitationProbabilityMax),
      TOLERANCE.probability,
    ),
    windSpeedMax: combineValues(pick(points, (p) => p.windSpeedMax), TOLERANCE.wind),
    condition: combineConditions(pick(points, (p) => p.condition)),
    sunrise: first((p) => p.sunrise),
    sunset: first((p) => p.sunset),
  }
}

/** Temperatura 40 %, chuva 30 %, condição 30 %; renormaliza se faltar algum. */
function overallConfidence(hour: ConsensusHour): number {
  const rain = hour.precipitationProbability ?? hour.precipitation
  const parts: [number, number][] = []
  if (hour.temperature) parts.push([0.4, hour.temperature.confidence])
  if (rain) parts.push([0.3, rain.confidence])
  if (hour.condition) {
    const votes = Object.keys(hour.condition.bySource).length
    parts.push([0.3, hour.condition.agreement * coverage(votes)])
  }
  const weight = parts.reduce((sum, [w]) => sum + w, 0)
  if (weight === 0) return 0
  return round(parts.reduce((sum, [w, c]) => sum + w * c, 0) / weight, 2)
}

// ───────────────────────────── entrada ─────────────────────────────

export class NoSourcesError extends Error {
  constructor() {
    super('Nenhuma fonte respondeu')
    this.name = 'NoSourcesError'
  }
}

export function buildConsensus(
  location: Location,
  results: SourceResult[],
  now: Date = new Date(),
): ConsensusForecast {
  const forecasts = results.flatMap((r) => (r.status === 'ok' ? [r.forecast] : []))
  if (forecasts.length === 0) throw new NoSourcesError()

  const hours = indexBy(forecasts, (f) => f.hourly, (p) => p.time)
  const days = indexBy(forecasts, (f) => f.daily, (p) => p.date)

  const daily = [...days.keys()]
    .sort()
    .filter((date) => date >= datePart(toLocalIso(now, location.timezone)))
    .slice(0, DAILY_COUNT)
    .map((date) => combineDay(date, days.get(date)!))
  const sun = new Map(daily.map((d) => [d.date, { sunrise: d.sunrise, sunset: d.sunset }]))

  const currentTime = floorToHour(toLocalIso(now, location.timezone))
  const times = [...hours.keys()].sort().filter((time) => time >= currentTime)
  if (times.length === 0) throw new NoSourcesError()

  const hourly = times.slice(0, HOURLY_COUNT).map((time) => combineHour(time, hours.get(time)!, sun))
  const current = hourly[0]

  return {
    location,
    generatedAt: now.toISOString(),
    current,
    hourly,
    daily,
    sources: results.map((r) =>
      r.status === 'ok' ? { source: r.source, ok: true } : { source: r.source, ok: false, error: r.error },
    ),
    confidence: overallConfidence(current),
  }
}

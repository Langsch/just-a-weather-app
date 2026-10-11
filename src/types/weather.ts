import type { Location } from './location'

/*
 * Contrato de dados do app.
 *
 * Fluxo: cada fonte devolve um SourceForecast (já normalizado, unidades métricas)
 * → o consenso combina todas em um ConsensusForecast → a interface só lê o consenso.
 * Conversão de unidades (°F, mph) acontece apenas na exibição.
 */

// ───────────────────────────── fontes ─────────────────────────────

/** Modelos via Open-Meteo (uma chamada com `models=`) + MET Norway (API própria). */
export type SourceId = 'ecmwf' | 'gfs' | 'icon' | 'meteofrance' | 'metno'

export interface SourceInfo {
  id: SourceId
  /** Nome curto para a interface, ex.: `ECMWF`. */
  label: string
  /** Quem produz o modelo, ex.: `Centro Europeu`. */
  provider: string
  /** Resolução aproximada da grade, em km. */
  resolutionKm: number
}

// ───────────────────────────── condição ─────────────────────────────

/**
 * Condição simplificada, derivada do código WMO. Cada uma terá um ícone 1-bit
 * e uma arte ASCII. Variante noturna é decidida na interface por `isDay`.
 */
export type Condition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'thunderstorm'

// ─────────────────────── previsão de uma fonte ───────────────────────

/** Qualquer campo pode ser `null`: nem todo modelo fornece toda variável. */
export interface HourlyPoint {
  /** ISO local sem fuso, ex.: `2026-10-10T14:00`. */
  time: string
  temperature: number | null // °C
  apparentTemperature: number | null // °C
  precipitation: number | null // mm na hora
  precipitationProbability: number | null // 0–100
  humidity: number | null // 0–100
  windSpeed: number | null // km/h
  windDirection: number | null // graus, 0 = norte
  condition: Condition | null
}

export interface DailyPoint {
  /** ISO local, ex.: `2026-10-10`. */
  date: string
  temperatureMax: number | null
  temperatureMin: number | null
  precipitationSum: number | null // mm
  precipitationProbabilityMax: number | null // 0–100
  windSpeedMax: number | null // km/h
  condition: Condition | null
  sunrise: string | null // ISO local
  sunset: string | null // ISO local
}

export interface SourceForecast {
  source: SourceId
  fetchedAt: string // ISO com fuso
  hourly: HourlyPoint[]
  daily: DailyPoint[]
}

export type SourceResult =
  | { source: SourceId; status: 'ok'; forecast: SourceForecast }
  | { source: SourceId; status: 'error'; error: string }

// ───────────────────────────── consenso ─────────────────────────────

/** Um valor numérico combinado de várias fontes. */
export interface ConsensusValue {
  /** Mediana entre as fontes que responderam. */
  value: number
  min: number
  max: number
  /** max − min. */
  spread: number
  /** Quantas fontes contribuíram para este valor. */
  sourceCount: number
  /** 0–1. Alta quando as fontes concordam e há várias delas. */
  confidence: number
  /** Valor de cada fonte. Uso interno (depuração e testes); não vai para a interface. */
  bySource: Partial<Record<SourceId, number>>
}

export interface ConsensusCondition {
  /** Condição mais votada (desempate pela mais severa). */
  value: Condition
  /** Fração das fontes que votaram na condição vencedora, 0–1. */
  agreement: number
  bySource: Partial<Record<SourceId, Condition>>
}

export interface ConsensusHour {
  time: string
  isDay: boolean
  temperature: ConsensusValue | null
  apparentTemperature: ConsensusValue | null
  precipitation: ConsensusValue | null
  precipitationProbability: ConsensusValue | null
  humidity: ConsensusValue | null
  windSpeed: ConsensusValue | null
  /** Média circular das direções; sem confidence própria. */
  windDirection: number | null
  condition: ConsensusCondition | null
}

export interface ConsensusDay {
  date: string
  temperatureMax: ConsensusValue | null
  temperatureMin: ConsensusValue | null
  precipitationSum: ConsensusValue | null
  precipitationProbabilityMax: ConsensusValue | null
  windSpeedMax: ConsensusValue | null
  condition: ConsensusCondition | null
  /** Astronômicos, iguais para todas as fontes. */
  sunrise: string | null
  sunset: string | null
}

export interface SourceStatus {
  source: SourceId
  ok: boolean
  /** Mensagem curta quando `ok` é false. */
  error?: string
}

export interface ConsensusForecast {
  location: Location
  generatedAt: string // ISO com fuso
  /**
   * Hora atual derivada do hourly de cada modelo (o bloco `current` do
   * Open-Meteo não vem separado por modelo).
   */
  current: ConsensusHour
  /** Próximas 48 h a partir da hora atual. */
  hourly: ConsensusHour[]
  /** Hoje + 6 dias. */
  daily: ConsensusDay[]
  sources: SourceStatus[]
  /** Confiança geral do momento atual, 0–1. Interna: só ajusta o tom dos textos. */
  confidence: number
}

// ─────────────────────────── estado da tela ───────────────────────────

export type ForecastErrorReason =
  | 'offline' // sem rede e sem cache
  | 'location-denied' // usuário negou o GPS
  | 'location-unavailable' // GPS ligado, mas sem posição
  | 'all-sources-failed' // rede ok, mas nenhuma fonte respondeu

export type ForecastState =
  | { status: 'loading'; previous?: ConsensusForecast }
  | { status: 'ready'; forecast: ConsensusForecast }
  /** Mostrando o cache porque a atualização falhou. */
  | { status: 'stale'; forecast: ConsensusForecast; reason: ForecastErrorReason }
  | { status: 'error'; reason: ForecastErrorReason }

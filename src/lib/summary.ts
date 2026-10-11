import type { Messages } from '../i18n'
import type { DayPeriod } from '../i18n/en'
import type { Condition, ConsensusForecast, ConsensusHour } from '../types/weather'
import { datePart } from './time'

/*
 * A frase do dia ("Possible rain in the afternoon." / "Possível chuva à tarde."). É aqui
 * que a confiança do consenso aparece para o usuário, só como tom: fontes divergindo → "Possível ...".
 */

const RAIN: Condition[] = ['drizzle', 'rain', 'heavy-rain', 'thunderstorm']
const RAIN_PROBABILITY = 50
const RAIN_MM = 0.3
const CONFIDENT = 0.6

function period(time: string): DayPeriod {
  const hour = Number(time.slice(11, 13))
  if (hour < 6) return 'night'
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

function isRainy(hour: ConsensusHour): boolean {
  if (hour.condition && RAIN.includes(hour.condition.value)) return true
  if (hour.precipitationProbability) return hour.precipitationProbability.value >= RAIN_PROBABILITY
  return (hour.precipitation?.value ?? 0) >= RAIN_MM
}

function hourConfidence(hour: ConsensusHour): number {
  const parts = [hour.condition?.agreement, hour.precipitationProbability?.confidence ?? hour.precipitation?.confidence]
  const known = parts.filter((p): p is number => p !== undefined)
  return known.length ? known.reduce((a, b) => a + b, 0) / known.length : 0
}

/**
 * Resumo de um dia a partir de um horário (padrão: agora, só o restante de hoje).
 * Com horas disponíveis (próximas 48 h) usa a previsão hora a hora; além disso, o resumo diário.
 */
export function daySummary(forecast: ConsensusForecast, t: Messages, from: string = forecast.current.time): string {
  const date = datePart(from)
  const day = forecast.daily.find((d) => d.date === date)
  const hours = forecast.hourly.filter((h) => datePart(h.time) === date && h.time >= from)

  if (hours.length > 0) {
    const rainy = hours.filter(isRainy)
    if (rainy.length > 0) {
      const stormy = rainy.some((h) => h.condition?.value === 'thunderstorm')
      const confidence = rainy.reduce((sum, h) => sum + hourConfidence(h), 0) / rainy.length
      const periods = [...new Set(rainy.map((h) => period(h.time)))]
      const when = periods.length >= 3 ? t.summary.allDay : t.summary.when(periods)
      return `${rainPrefix(stormy, confidence, t)} ${when}.`
    }
  } else if (day) {
    const stormy = day.condition?.value === 'thunderstorm'
    const probability = day.precipitationProbabilityMax
    const rainyCondition = day.condition !== null && RAIN.includes(day.condition.value)
    if ((probability && probability.value >= RAIN_PROBABILITY) || (!probability && rainyCondition)) {
      const confidence = probability?.confidence ?? day.condition?.agreement ?? 0
      return `${rainPrefix(stormy, confidence, t)} ${t.summary.allDay}.`
    }
  }

  const max = day?.temperatureMax?.value
  const min = day?.temperatureMin?.value
  if (max !== undefined && max >= 32) return t.summary.hot
  if (min !== undefined && min <= 10) return t.summary.cold
  const condition = hours[0]?.condition?.value ?? day?.condition?.value
  if (condition === 'clear') return t.summary.clear
  return t.summary.dry
}

function rainPrefix(stormy: boolean, confidence: number, t: Messages): string {
  return capitalize(t.summary.rain(confidence < CONFIDENT, stormy))
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1)

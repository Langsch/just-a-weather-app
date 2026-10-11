import { describe, expect, it } from 'vitest'
import type { Condition, ConsensusForecast, ConsensusHour, ConsensusValue } from '../types/weather'
import { MESSAGES } from '../i18n'
import { daySummary } from './summary'

const { en, pt } = MESSAGES

const value = (v: number, confidence = 1): ConsensusValue => ({
  value: v,
  min: v,
  max: v,
  spread: 0,
  sourceCount: 4,
  confidence,
  bySource: {},
})

function hour(time: string, condition: Condition, probability: number, agreement = 1): ConsensusHour {
  return {
    time: `2026-10-10T${time}`,
    isDay: true,
    temperature: value(24),
    apparentTemperature: null,
    precipitation: null,
    precipitationProbability: value(probability, agreement),
    humidity: null,
    windSpeed: null,
    windDirection: null,
    condition: { value: condition, agreement, bySource: {} },
  }
}

function forecast(hours: ConsensusHour[], max = 28, min = 20): ConsensusForecast {
  return {
    location: { id: 'x', name: 'X', country: '', latitude: 0, longitude: 0, timezone: 'UTC' },
    generatedAt: '',
    current: hours[0],
    hourly: hours,
    daily: [
      {
        date: '2026-10-10',
        temperatureMax: value(max),
        temperatureMin: value(min),
        precipitationSum: null,
        precipitationProbabilityMax: null,
        windSpeedMax: null,
        condition: null,
        sunrise: null,
        sunset: null,
      },
    ],
    sources: [],
    confidence: 1,
  }
}

describe('daySummary', () => {
  it('afirma a chuva quando as fontes concordam', () => {
    const f = forecast([hour('09:00', 'cloudy', 10), hour('14:00', 'rain', 80), hour('15:00', 'rain', 90)])
    expect(daySummary(f, pt)).toBe('Chuva à tarde.')
  })

  it('usa "possível" quando as fontes divergem', () => {
    const f = forecast([hour('09:00', 'cloudy', 10), hour('15:00', 'rain', 55, 0.3)])
    expect(daySummary(f, pt)).toBe('Possível chuva à tarde.')
  })

  it('junta os períodos e destaca tempestade', () => {
    const f = forecast([hour('08:00', 'rain', 70), hour('20:00', 'thunderstorm', 80)])
    expect(daySummary(f, pt)).toBe('Tempestade pela manhã e à noite.')
  })

  it('sem chuva, comenta a temperatura', () => {
    expect(daySummary(forecast([hour('09:00', 'clear', 0)], 34), pt)).toBe('Dia quente, sem chuva.')
    expect(daySummary(forecast([hour('09:00', 'cloudy', 0)], 25, 8), pt)).toBe('Dia frio, sem chuva.')
    expect(daySummary(forecast([hour('09:00', 'cloudy', 0)]), pt)).toBe('Sem chuva prevista.')
  })

  it('ignora horas de amanhã', () => {
    const tomorrow = { ...hour('03:00', 'rain', 90), time: '2026-10-11T03:00' }
    expect(daySummary(forecast([hour('22:00', 'cloudy', 0), tomorrow]), pt)).toBe('Sem chuva prevista.')
  })

  it('resume outro dia a partir de um horário', () => {
    const f = forecast([hour('09:00', 'cloudy', 0), hour('15:00', 'rain', 90)])
    expect(daySummary(f, pt, '2026-10-10T16:00')).toBe('Sem chuva prevista.')
    expect(daySummary(f, pt, '2026-10-10T07:00')).toBe('Chuva à tarde.')
  })

  it('sem horas disponíveis, usa o resumo diário', () => {
    const f = forecast([hour('09:00', 'cloudy', 0)])
    f.daily.push({ ...f.daily[0], date: '2026-10-14', precipitationProbabilityMax: value(80, 0.4) })
    expect(daySummary(f, pt, '2026-10-14T07:00')).toBe('Possível chuva ao longo do dia.')
  })
})

describe('daySummary em inglês', () => {
  it('afirma ou pondera a chuva', () => {
    const sure = forecast([hour('09:00', 'cloudy', 10), hour('14:00', 'rain', 80), hour('15:00', 'rain', 90)])
    expect(daySummary(sure, en)).toBe('Rain in the afternoon.')
    const unsure = forecast([hour('09:00', 'cloudy', 10), hour('15:00', 'rain', 55, 0.3)])
    expect(daySummary(unsure, en)).toBe('Possible rain in the afternoon.')
  })

  it('junta os períodos de forma natural', () => {
    const f = forecast([hour('08:00', 'rain', 70), hour('20:00', 'thunderstorm', 80)])
    expect(daySummary(f, en)).toBe('Thunderstorms in the morning and evening.')
    const night = forecast([hour('02:00', 'rain', 80), hour('15:00', 'rain', 80)])
    expect(daySummary(night, en)).toBe('Rain overnight and in the afternoon.')
    const allDay = forecast([hour('02:00', 'rain', 80), hour('09:00', 'rain', 80), hour('15:00', 'rain', 80)])
    expect(daySummary(allDay, en)).toBe('Rain throughout the day.')
  })

  it('sem chuva, comenta a temperatura', () => {
    expect(daySummary(forecast([hour('09:00', 'clear', 0)], 34), en)).toBe('Hot day, no rain.')
    expect(daySummary(forecast([hour('09:00', 'clear', 0)]), en)).toBe('Clear skies, no rain.')
    expect(daySummary(forecast([hour('09:00', 'cloudy', 0)]), en)).toBe('No rain expected.')
  })
})

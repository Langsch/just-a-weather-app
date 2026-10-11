import { describe, expect, it } from 'vitest'
import { FIXTURE_NOW, RIO, metnoFixture } from '../test/fixtures'
import { buildMetnoUrl, parseMetno } from './metno'

describe('MET Norway', () => {
  it('limita as coordenadas a 4 casas decimais', () => {
    expect(buildMetnoUrl({ ...RIO, latitude: -22.906421, longitude: -43.182234 })).toMatch(
      /lat=-22\.9064&lon=-43\.1822$/,
    )
  })

  const result = parseMetno(metnoFixture, RIO.timezone, FIXTURE_NOW.toISOString())
  if (result.status !== 'ok') throw new Error('esperava ok')
  const { hourly, daily } = result.forecast

  it('converte horários UTC para o fuso local e vento para km/h', () => {
    expect(hourly[0].time).toBe('2026-10-10T19:00') // 22:00Z
    expect(hourly[0].windSpeed).toBeCloseTo(2.0 * 3.6)
    expect(hourly[0].apparentTemperature).toBeNull()
    expect(hourly[0].precipitationProbability).toBeNull()
  })

  it('só resume dias com cobertura completa', () => {
    // Hoje começa às 19:00 locais: incompleto, fica de fora.
    expect(daily[0].date).toBe('2026-10-11')
    for (const day of daily) {
      expect(day.temperatureMax!).toBeGreaterThanOrEqual(day.temperatureMin!)
      expect(day.precipitationSum).toBeGreaterThanOrEqual(0)
      expect(day.condition).not.toBeNull()
    }
  })

  it('soma a chuva do dia sem contar o mesmo intervalo duas vezes', () => {
    const nextDayHours = hourly.filter((p) => p.time.startsWith('2026-10-11'))
    const hourlySum = nextDayHours.reduce((sum, p) => sum + (p.precipitation ?? 0), 0)
    expect(daily[0].precipitationSum).toBeCloseTo(hourlySum, 0)
  })
})

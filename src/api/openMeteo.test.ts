import { describe, expect, it } from 'vitest'
import { FIXTURE_NOW, RIO, openMeteoFixture } from '../test/fixtures'
import { buildOpenMeteoUrl, parseOpenMeteo } from './openMeteo'

const SOURCES = ['ecmwf', 'gfs', 'icon', 'meteofrance'] as const

describe('Open-Meteo', () => {
  it('monta a URL com os modelos pedidos', () => {
    const url = new URL(buildOpenMeteoUrl(RIO, ['ecmwf', 'gfs']))
    expect(url.searchParams.get('models')).toBe('ecmwf_ifs025,gfs_seamless')
    expect(url.searchParams.get('timezone')).toBe('America/Sao_Paulo')
  })

  const results = parseOpenMeteo(openMeteoFixture, [...SOURCES], FIXTURE_NOW.toISOString())

  it('separa a resposta em uma previsão por modelo', () => {
    expect(results.map((r) => [r.source, r.status])).toEqual(SOURCES.map((s) => [s, 'ok']))
  })

  it('normaliza os pontos horários', () => {
    const ecmwf = results[0]
    if (ecmwf.status !== 'ok') throw new Error('esperava ok')
    expect(ecmwf.forecast.hourly).toHaveLength(168)
    const first = ecmwf.forecast.hourly[0]
    expect(first.time).toBe('2026-10-10T00:00')
    expect(first.temperature).toEqual(expect.any(Number))
    expect(first.condition).not.toBeNull()
    expect(ecmwf.forecast.daily).toHaveLength(7)
    expect(ecmwf.forecast.daily[0].sunrise).toBe('2026-10-10T05:25')
  })

  it('descarta horas fora do horizonte do modelo e mantém nulls de variáveis ausentes', () => {
    const meteofrance = results[3]
    if (meteofrance.status !== 'ok') throw new Error('esperava ok')
    expect(meteofrance.forecast.hourly.length).toBeLessThan(168)
    expect(meteofrance.forecast.hourly.every((p) => p.precipitationProbability === null)).toBe(true)
    expect(meteofrance.forecast.daily.length).toBeLessThan(7)
  })

  it('marca como erro um modelo sem nenhum dado', () => {
    const [result] = parseOpenMeteo({ hourly: { time: ['2026-10-10T00:00'] }, daily: { time: [] } }, ['gfs'], '')
    expect(result.status).toBe('error')
  })
})

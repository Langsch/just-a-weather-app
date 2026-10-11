import { describe, expect, it } from 'vitest'
import { parseMetno } from '../api/metno'
import { parseOpenMeteo } from '../api/openMeteo'
import { FIXTURE_NOW, RIO, metnoFixture, openMeteoFixture } from '../test/fixtures'
import type { SourceResult } from '../types/weather'
import { NoSourcesError, buildConsensus, combineConditions, combineValues } from './consensus'

const tolerance = { high: 1, low: 5 }

describe('combineValues', () => {
  it('usa a mediana, resistente a um modelo fora da curva', () => {
    const result = combineValues({ ecmwf: 24, gfs: 25, icon: 24.5, meteofrance: 33 }, tolerance)!
    expect(result.value).toBe(24.8)
    expect(result.min).toBe(24)
    expect(result.max).toBe(33)
    expect(result.sourceCount).toBe(4)
  })

  it('dá confiança alta quando as fontes concordam', () => {
    const agree = combineValues({ ecmwf: 24, gfs: 24.5, icon: 24.2 }, tolerance)!
    const disagree = combineValues({ ecmwf: 20, gfs: 24, icon: 28 }, tolerance)!
    expect(agree.confidence).toBeGreaterThan(0.8)
    expect(disagree.confidence).toBe(0)
  })

  it('dá menos confiança para uma fonte só', () => {
    const one = combineValues({ ecmwf: 24 }, tolerance)!
    const three = combineValues({ ecmwf: 24, gfs: 24, icon: 24 }, tolerance)!
    expect(one.confidence).toBeLessThan(three.confidence)
  })

  it('devolve null sem valores', () => {
    expect(combineValues({}, tolerance)).toBeNull()
  })
})

describe('combineConditions', () => {
  it('escolhe a mais votada', () => {
    const result = combineConditions({ ecmwf: 'rain', gfs: 'rain', icon: 'cloudy' })!
    expect(result.value).toBe('rain')
    expect(result.agreement).toBe(0.67)
  })

  it('desempata pela mais severa', () => {
    expect(combineConditions({ ecmwf: 'cloudy', gfs: 'rain' })!.value).toBe('rain')
  })
})

describe('buildConsensus com respostas reais', () => {
  const results: SourceResult[] = [
    ...parseOpenMeteo(openMeteoFixture, ['ecmwf', 'gfs', 'icon', 'meteofrance'], ''),
    parseMetno(metnoFixture, RIO.timezone, ''),
  ]
  const forecast = buildConsensus(RIO, results, FIXTURE_NOW)

  it('começa na hora atual e cobre 48 h e 7 dias', () => {
    expect(forecast.current.time).toBe('2026-10-10T19:00')
    expect(forecast.current.isDay).toBe(false)
    expect(forecast.hourly).toHaveLength(48)
    expect(forecast.daily).toHaveLength(7)
    expect(forecast.daily[0].date).toBe('2026-10-10')
    expect(forecast.daily[0].sunrise).toBe('2026-10-10T05:25')
  })

  it('combina todas as fontes na hora atual', () => {
    expect(forecast.sources.every((s) => s.ok)).toBe(true)
    expect(forecast.current.temperature!.sourceCount).toBe(5)
    expect(Object.keys(forecast.current.temperature!.bySource)).toContain('metno')
    expect(forecast.confidence).toBeGreaterThan(0)
    expect(forecast.confidence).toBeLessThanOrEqual(1)
  })

  it('segue funcionando quando uma fonte falha', () => {
    const partial = buildConsensus(
      RIO,
      [...results.slice(0, 4), { source: 'metno', status: 'error', error: 'timeout' }],
      FIXTURE_NOW,
    )
    expect(partial.current.temperature!.sourceCount).toBe(4)
    expect(partial.sources.find((s) => s.source === 'metno')).toEqual({
      source: 'metno',
      ok: false,
      error: 'timeout',
    })
  })

  it('lança NoSourcesError quando nenhuma fonte responde', () => {
    expect(() =>
      buildConsensus(RIO, [{ source: 'gfs', status: 'error', error: 'x' }], FIXTURE_NOW),
    ).toThrow(NoSourcesError)
  })
})

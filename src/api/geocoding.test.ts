import { describe, expect, it } from 'vitest'
import { geocodingFixture } from '../test/fixtures'
import { parseGeocoding } from './geocoding'

describe('geocoding', () => {
  it('converte resultados em Location', () => {
    const [rio] = parseGeocoding(geocodingFixture)
    expect(rio).toEqual({
      id: '3451190',
      name: 'Rio de Janeiro',
      region: 'Rio de Janeiro',
      country: 'Brasil',
      latitude: -22.90642,
      longitude: -43.18223,
      timezone: 'America/Sao_Paulo',
    })
  })

  it('devolve lista vazia quando nada é encontrado', () => {
    expect(parseGeocoding({})).toEqual([])
  })
})

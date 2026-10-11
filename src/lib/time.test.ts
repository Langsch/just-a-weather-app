import { describe, expect, it } from 'vitest'
import { datePart, floorToHour, toLocalIso } from './time'

describe('time', () => {
  it('converte um instante UTC para o horário local do fuso', () => {
    expect(toLocalIso(new Date('2026-10-10T22:00:00Z'), 'America/Sao_Paulo')).toBe('2026-10-10T19:00')
    expect(toLocalIso(new Date('2026-10-11T02:30:00Z'), 'America/Sao_Paulo')).toBe('2026-10-10T23:30')
    expect(toLocalIso(new Date('2026-10-10T22:00:00Z'), 'Asia/Tokyo')).toBe('2026-10-11T07:00')
  })

  it('arredonda para a hora e extrai a data', () => {
    expect(floorToHour('2026-10-10T14:59')).toBe('2026-10-10T14:00')
    expect(datePart('2026-10-10T14:59')).toBe('2026-10-10')
  })
})

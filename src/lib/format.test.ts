import { describe, expect, it } from 'vitest'
import { MESSAGES } from '../i18n'
import { glyphFor, headerDate, hourLabel, millimeters, shortDate, temperature, windDirection, windSpeed } from './format'

const { en, pt } = MESSAGES

describe('format', () => {
  it('converte temperatura', () => {
    expect(temperature(24.4, 'c')).toBe('24°')
    expect(temperature(24, 'f')).toBe('75°')
    expect(temperature(null, 'c')).toBe('--°')
  })

  it('converte vento com o separador decimal do idioma', () => {
    expect(windSpeed(14, 'kmh', pt)).toBe('14 km/h')
    expect(windSpeed(36, 'ms', pt)).toBe('10,0 m/s')
    expect(windSpeed(36, 'ms', en)).toBe('10.0 m/s')
    expect(windSpeed(16.09, 'mph', en)).toBe('10 mph')
  })

  it('mostra de onde vem o vento com a seta para onde ele vai', () => {
    expect(windDirection(135, pt)).toBe('↖ SE')
    expect(windDirection(0, pt)).toBe('↓ N')
    expect(windDirection(359, pt)).toBe('↓ N')
    expect(windDirection(270, pt)).toBe('→ O')
    expect(windDirection(270, en)).toBe('→ W')
  })

  it('formata milímetros e datas em pt-BR', () => {
    expect(millimeters(3.24, pt)).toBe('3,2 mm')
    expect(millimeters(0, pt)).toBe('0 mm')
    expect(headerDate('2026-10-10T09:12', pt)).toBe('SÁB 10 OUT • 09:12')
    expect(shortDate('2026-10-14', pt)).toBe('14 out')
    expect(hourLabel('2026-10-10T14:00', pt)).toBe('14h')
  })

  it('formata milímetros e datas em inglês', () => {
    expect(millimeters(3.24, en)).toBe('3.2 mm')
    expect(headerDate('2026-10-10T09:12', en)).toBe('SAT OCT 10 • 09:12')
    expect(shortDate('2026-10-14', en)).toBe('Oct 14')
    expect(hourLabel('2026-10-10T14:00', en)).toBe('14:00')
  })

  it('escolhe o ícone noturno quando existe', () => {
    expect(glyphFor('clear', false)).toBe('clear-night')
    expect(glyphFor('rain', false)).toBe('rain')
    expect(glyphFor(null)).toBe('cloudy')
  })
})

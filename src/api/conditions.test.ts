import { describe, expect, it } from 'vitest'
import { fromMetnoSymbol, fromWmoCode, mostSevere } from './conditions'

describe('fromWmoCode', () => {
  it.each([
    [0, 'clear'],
    [1, 'clear'],
    [2, 'partly-cloudy'],
    [3, 'cloudy'],
    [45, 'fog'],
    [53, 'drizzle'],
    [61, 'rain'],
    [80, 'rain'],
    [65, 'heavy-rain'],
    [82, 'heavy-rain'],
    [73, 'snow'],
    [95, 'thunderstorm'],
  ] as const)('%i → %s', (code, condition) => {
    expect(fromWmoCode(code)).toBe(condition)
  })

  it('devolve null para código ausente ou desconhecido', () => {
    expect(fromWmoCode(null)).toBeNull()
    expect(fromWmoCode(10)).toBeNull()
  })
})

describe('fromMetnoSymbol', () => {
  it.each([
    ['clearsky_day', 'clear'],
    ['fair_night', 'clear'],
    ['partlycloudy_day', 'partly-cloudy'],
    ['cloudy', 'cloudy'],
    ['fog', 'fog'],
    ['lightrainshowers_night', 'rain'],
    ['rain', 'rain'],
    ['heavyrainshowers_day', 'heavy-rain'],
    ['lightsleet', 'snow'],
    ['rainandthunder', 'thunderstorm'],
  ] as const)('%s → %s', (symbol, condition) => {
    expect(fromMetnoSymbol(symbol)).toBe(condition)
  })
})

describe('mostSevere', () => {
  it('escolhe a condição mais severa', () => {
    expect(mostSevere(['clear', 'rain', 'cloudy'])).toBe('rain')
    expect(mostSevere([])).toBeNull()
  })
})

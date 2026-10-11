import type { Condition } from '../types/weather'

/** Da menos para a mais severa. Usada em desempates e no resumo diário. */
export const SEVERITY: Condition[] = [
  'clear',
  'partly-cloudy',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'snow',
  'heavy-rain',
  'thunderstorm',
]

export function mostSevere(conditions: Condition[]): Condition | null {
  let worst: Condition | null = null
  for (const condition of conditions) {
    if (worst === null || SEVERITY.indexOf(condition) > SEVERITY.indexOf(worst)) worst = condition
  }
  return worst
}

/** https://open-meteo.com/en/docs → "WMO Weather interpretation codes". */
export function fromWmoCode(code: number | null): Condition | null {
  if (code === null) return null
  if (code <= 1) return 'clear'
  if (code === 2) return 'partly-cloudy'
  if (code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code === 65 || code === 82) return 'heavy-rain'
  if ((code >= 61 && code <= 67) || code === 80 || code === 81) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunderstorm'
  return null
}

/** https://api.met.no/weatherapi/weathericon/2.0/documentation → `symbol_code`. */
export function fromMetnoSymbol(symbol: string | undefined): Condition | null {
  if (!symbol) return null
  const base = symbol.replace(/_(day|night|polartwilight)$/, '')
  if (base.includes('thunder')) return 'thunderstorm'
  if (base.includes('snow') || base.includes('sleet')) return 'snow'
  if (base.startsWith('heavyrain')) return 'heavy-rain'
  if (base.includes('rain')) return 'rain'
  if (base === 'fog') return 'fog'
  if (base === 'cloudy') return 'cloudy'
  if (base === 'partlycloudy') return 'partly-cloudy'
  if (base === 'clearsky' || base === 'fair') return 'clear'
  return null
}

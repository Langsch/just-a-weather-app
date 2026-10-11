import type { Glyph } from '../components/glyphs'
import type { Messages } from '../i18n'
import type { TemperatureUnit, WindUnit } from '../types/settings'
import type { Condition } from '../types/weather'

export function temperature(celsius: number | null | undefined, unit: TemperatureUnit): string {
  if (celsius == null) return '--°'
  const value = unit === 'f' ? (celsius * 9) / 5 + 32 : celsius
  return `${Math.round(value)}°`
}

export function windSpeed(kmh: number | null | undefined, unit: WindUnit, t: Messages): string {
  if (kmh == null) return '--'
  if (unit === 'ms') return `${decimal(kmh / 3.6, t)} m/s`
  if (unit === 'mph') return `${Math.round(kmh / 1.609)} mph`
  return `${Math.round(kmh)} km/h`
}

/** Para onde o vento sopra (oposto de onde vem). */
const ARROWS = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘']

/** Direção meteorológica (de onde o vento vem) → `↖ SE`. */
export function windDirection(degrees: number | null | undefined, t: Messages): string {
  if (degrees == null) return ''
  const i = Math.round((((degrees % 360) + 360) % 360) / 45) % 8
  return `${ARROWS[i]} ${t.compass[i]}`
}

/** 3.25 → `3.3` (en) ou `3,3` (pt) */
export function decimal(value: number, t: Messages, digits = 1): string {
  return value.toLocaleString(t.locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function millimeters(mm: number | null | undefined, t: Messages): string {
  if (mm == null) return '--'
  return mm === 0 ? '0 mm' : `${decimal(mm, t)} mm`
}

export function percent(value: number | null | undefined): string {
  return value == null ? '--' : `${Math.round(value)}%`
}

/** `2026-10-10T05:24` → `05:24` */
export const clock = (localIso: string | null | undefined) => (localIso ? localIso.slice(11, 16) : '--:--')

/** `2026-10-10T14:00` → `14:00` (en) ou `14h` (pt) */
export const hourLabel = (localIso: string, t: Messages) => t.hourLabel(localIso.slice(11, 13))

function parts(localIso: string) {
  const [y, m, d] = localIso.slice(0, 10).split('-').map(Number)
  return { weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), month: m - 1, day: d }
}

/** `2026-10-10` → `SAT` / `SÁB` */
export const weekday = (localIso: string, t: Messages) => t.weekdays[parts(localIso).weekday]

/** `2026-10-10` → `Oct 10` / `10 out` */
export function shortDate(localIso: string, t: Messages): string {
  const { day, month } = parts(localIso)
  return t.shortDate(day, t.months[month])
}

/** `2026-10-10T09:12` → `SAT OCT 10 • 09:12` / `SÁB 10 OUT • 09:12` */
export function headerDate(localIso: string, t: Messages): string {
  const { weekday: w, day, month } = parts(localIso)
  return t.headerDate(t.weekdays[w], day, t.months[month], clock(localIso))
}

export function glyphFor(condition: Condition | null | undefined, isDay = true): Glyph {
  const c = condition ?? 'cloudy'
  if (!isDay && c === 'clear') return 'clear-night'
  if (!isDay && c === 'partly-cloudy') return 'partly-cloudy-night'
  return c
}

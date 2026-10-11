import { placeName, type Messages } from '../i18n'
import * as fmt from '../lib/format'
import { daySummary } from '../lib/summary'
import { datePart, floorToHour, toLocalIso } from '../lib/time'
import type { TemperatureUnit } from '../types/settings'
import type { ConsensusForecast } from '../types/weather'

export const NOTIFICATION_BASE_ID = 1000
export const NOTIFICATION_DAYS = 7

export interface PlannedNotification {
  id: number
  at: Date
  title: string
  body: string
}

/**
 * Próximas ocorrências do horário `HH:MM` no fuso do aparelho, a partir de `now`.
 * Usa o construtor local do Date, então segue o fuso em que o app está rodando.
 */
export function nextOccurrences(time: string, now: Date, count: number): Date[] {
  const [hours, minutes] = time.split(':').map(Number)
  const dates: Date[] = []
  for (let offset = 0; dates.length < count && offset <= count; offset++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hours, minutes)
    if (at > now) dates.push(at)
  }
  return dates
}

/** "Possible rain in the afternoon." → "possible rain in the afternoon" */
const asClause = (sentence: string) => sentence.charAt(0).toLowerCase() + sentence.slice(1).replace(/\.$/, '')

/**
 * Textos das notificações dos próximos dias, a partir da previsão que temos agora.
 * Dias sem previsão (além do horizonte) ficam sem notificação.
 */
export function planDailyNotifications(
  forecast: ConsensusForecast,
  time: string,
  unit: TemperatureUnit,
  t: Messages,
  now: Date,
): PlannedNotification[] {
  const name = placeName(forecast.location, t)
  const { location } = forecast
  const planned: PlannedNotification[] = []

  nextOccurrences(time, now, NOTIFICATION_DAYS).forEach((at, i) => {
    const local = toLocalIso(at, location.timezone)
    const date = datePart(local)
    const day = forecast.daily.find((d) => d.date === date)
    if (!day) return

    const hour = forecast.hourly.find((h) => h.time === floorToHour(local))
    const title = hour?.temperature
      ? `${name} • ${t.notification.now(fmt.temperature(hour.temperature.value, unit))}`
      : `${name} • ${fmt.weekday(date, t)} ${fmt.shortDate(date, t)}`
    const range = t.notification.range(
      fmt.temperature(day.temperatureMax?.value, unit),
      fmt.temperature(day.temperatureMin?.value, unit),
    )

    planned.push({
      id: NOTIFICATION_BASE_ID + i,
      at,
      title,
      body: `${range} • ${asClause(daySummary(forecast, t, local))}`,
    })
  })

  return planned
}

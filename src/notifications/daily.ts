import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getForecast } from '../api/forecast'
import { MESSAGES, resolveLanguage } from '../i18n'
import { loadForecast, saveForecast } from '../storage/forecastCache'
import type { Location } from '../types/location'
import type { Settings } from '../types/settings'
import { NOTIFICATION_BASE_ID, NOTIFICATION_DAYS, planDailyNotifications } from './plan'

/*
 * Notificação diária: a cada abertura do app (e quando os ajustes mudam) cancelamos
 * as pendentes e agendamos os próximos dias com a previsão mais recente. Se o app
 * ficar dias sem abrir, as notificações seguem saindo com a última previsão que tínhamos.
 */

const MAX_AGE_MS = 60 * 60 * 1000

export const notificationsSupported = () => Capacitor.isNativePlatform()

/** Pede permissão (Android 13+). No navegador, notificações agendadas não existem. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted'
}

async function cancelPlanned() {
  const ids = Array.from({ length: NOTIFICATION_DAYS }, (_, i) => ({ id: NOTIFICATION_BASE_ID + i }))
  await LocalNotifications.cancel({ notifications: ids })
}

async function resolveLocation(locationId: string, favorites: Location[]): Promise<Location | null> {
  if (locationId !== 'gps') return favorites.find((f) => f.id === locationId) ?? null
  // Não pedimos o GPS em segundo plano: usamos a última posição em que o app abriu.
  return (await loadForecast('gps'))?.location ?? null
}

async function freshForecast(location: Location) {
  const cached = await loadForecast(location.id)
  if (cached && Date.now() - Date.parse(cached.generatedAt) < MAX_AGE_MS) return cached
  try {
    const forecast = await getForecast(location)
    await saveForecast(forecast)
    return forecast
  } catch {
    return cached
  }
}

let running: Promise<void> = Promise.resolve()

/** Reagenda as notificações conforme os ajustes atuais. Chamadas concorrentes rodam em fila. */
export function syncDailyNotifications(settings: Settings, favorites: Location[]): Promise<void> {
  running = running.then(() => sync(settings, favorites)).catch((error) => {
    console.warn('Falha ao agendar notificações', error)
  })
  return running
}

async function sync(settings: Settings, favorites: Location[]) {
  if (!notificationsSupported()) return
  await cancelPlanned()

  const { enabled, time, locationId } = settings.notification
  if (!enabled) return
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return

  const location = await resolveLocation(locationId, favorites)
  if (!location) return
  const forecast = await freshForecast(location)
  if (!forecast) return

  const t = MESSAGES[resolveLanguage(settings.language)]
  const planned = planDailyNotifications(forecast, time, settings.temperatureUnit, t, new Date())
  await LocalNotifications.schedule({
    notifications: planned.map(({ id, at, title, body }) => ({
      id,
      title,
      body,
      schedule: { at, allowWhileIdle: true },
      // Alarme exato exigiria abrir os ajustes do sistema pedindo permissão (Android 14+).
      // Para um resumo do dia, alguns minutos de atraso não importam.
      isExactNotification: false,
    })),
  })
}

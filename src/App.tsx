import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { useEffect, useState } from 'react'
import { Nav, type Tab } from './components/Nav'
import { shownForecast, useForecast } from './hooks/useForecast'
import { useLocation } from './hooks/useLocation'
import { useI18n } from './i18n'
import { syncDailyNotifications } from './notifications/daily'
import { CitiesScreen } from './screens/CitiesScreen'
import { DaysScreen } from './screens/DaysScreen'
import { NowScreen } from './screens/NowScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { useAppState } from './state/context'
import type { Theme } from './types/settings'

type View = Tab | 'days'

/** Contador que sobe sempre que o app volta para o primeiro plano (só no nativo). */
function useResumeCount(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const handle = CapacitorApp.addListener('resume', () => setCount((n) => n + 1))
    return () => {
      handle.then((h) => h.remove())
    }
  }, [])
  return count
}

function useSystemDark(): boolean {
  const query = '(prefers-color-scheme: dark)'
  const [dark, setDark] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return dark
}

/** Aplica tema e acento como atributos no <html>; o CSS troca as variáveis. */
function useTheme(theme: Theme, accent: string): boolean {
  const systemDark = useSystemDark()
  const dark = theme === 'dark' || (theme === 'system' && systemDark)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = dark ? 'dark' : 'light'
    root.dataset.accent = accent
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e0e0e' : '#f4f1ea')
    if (Capacitor.isNativePlatform()) {
      SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light })
    }
  }, [dark, accent])
  return dark
}

function App() {
  const app = useAppState()
  const dark = useTheme(app.settings.theme, app.settings.accent)
  const { t } = useI18n()
  useEffect(() => {
    document.documentElement.lang = t.locale
  }, [t])
  const [view, setView] = useState<View>('now')

  const { state: location, retry: retryLocation } = useLocation(app.selected)
  const { state: forecast, retry: retryForecast } = useForecast(
    location.status === 'ready' ? location.location : null,
    location.status === 'loading' && app.selected === 'gps' ? 'gps' : null,
  )

  // Reagenda a notificação diária ao abrir/voltar ao app, ao mudar ajustes e quando
  // chega uma previsão nova (ela pode ser a da cidade da notificação).
  const resumes = useResumeCount()
  const { settings, favorites } = app
  const generatedAt = forecast.status === 'ready' ? forecast.forecast.generatedAt : null
  useEffect(() => {
    syncDailyNotifications(settings, favorites)
  }, [settings, favorites, generatedAt, resumes])

  return (
    <div className="app">
      {view === 'now' && (
        <NowScreen
          location={location}
          forecast={forecast}
          onRetryLocation={retryLocation}
          onRetryForecast={retryForecast}
          onOpenCities={() => setView('cities')}
          onOpenDays={() => setView('days')}
        />
      )}
      {view === 'days' && <DaysScreen forecast={shownForecast(forecast)} onBack={() => setView('now')} />}
      {view === 'cities' && (
        <CitiesScreen
          onPick={(picked) => {
            app.select(picked)
            setView('now')
          }}
        />
      )}
      {view === 'settings' && <SettingsScreen dark={dark} />}
      <Nav active={view === 'days' ? 'now' : view} onChange={setView} />
    </div>
  )
}

export default App

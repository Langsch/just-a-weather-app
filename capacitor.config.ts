import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.justaweatherapp',
  appName: 'Just a Weather App',
  webDir: 'dist',
  plugins: {
    // No app nativo, fetch passa pelo HTTP nativo: sem CORS e com User-Agent próprio (MET Norway exige).
    CapacitorHttp: { enabled: true },
    LocalNotifications: {
      smallIcon: 'ic_stat_weather',
      iconColor: '#0E0E0E',
    },
    SplashScreen: {
      backgroundColor: '#0E0E0E',
      launchShowDuration: 0,
    },
  },
}

export default config

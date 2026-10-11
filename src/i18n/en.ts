import type { Glyph } from '../components/glyphs'
import type { Condition } from '../types/weather'

/** Parte do dia usada na frase do resumo. */
export type DayPeriod = 'night' | 'morning' | 'afternoon' | 'evening'

/** Inglês é a referência (e o padrão): os outros idiomas precisam ter as mesmas chaves. */
export const en = {
  locale: 'en-US',

  // Datas e números
  weekdays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  /** `Oct 14` */
  shortDate: (day: number, month: string) => `${month.charAt(0)}${month.slice(1).toLowerCase()} ${day}`,
  /** `SAT OCT 10 • 09:12` */
  headerDate: (weekday: string, day: number, month: string, clock: string) => `${weekday} ${month} ${day} • ${clock}`,
  /** `14:00` */
  hourLabel: (hour: string) => `${hour}:00`,
  compass: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],

  conditions: {
    clear: 'clear sky',
    'partly-cloudy': 'partly cloudy',
    cloudy: 'cloudy',
    fog: 'fog',
    drizzle: 'drizzle',
    rain: 'rain',
    'heavy-rain': 'heavy rain',
    snow: 'snow',
    thunderstorm: 'thunderstorm',
  } satisfies Record<Condition, string>,

  glyphs: {
    clear: 'clear sky',
    'clear-night': 'clear sky, night',
    'partly-cloudy': 'partly cloudy',
    'partly-cloudy-night': 'partly cloudy, night',
    cloudy: 'cloudy',
    fog: 'fog',
    drizzle: 'drizzle',
    rain: 'rain',
    'heavy-rain': 'heavy rain',
    snow: 'snow',
    thunderstorm: 'thunderstorm',
    'nav-cidades': 'cities',
    'nav-ajustes': 'settings',
    app: 'Just a Weather App',
  } satisfies Record<Glyph, string>,

  // Frase do dia
  summary: {
    rain: (possible: boolean, stormy: boolean) =>
      `${possible ? 'Possible ' : ''}${stormy ? 'thunderstorms' : 'rain'}`,
    /** "in the morning and afternoon", "overnight and in the evening" */
    when: (periods: DayPeriod[]) => {
      const inThe = periods.filter((p) => p !== 'night')
      const parts = periods.includes('night') ? ['overnight'] : []
      if (inThe.length) parts.push(`in the ${joinList(inThe, 'and')}`)
      return joinList(parts, 'and')
    },
    allDay: 'throughout the day',
    hot: 'Hot day, no rain.',
    cold: 'Cold day, no rain.',
    clear: 'Clear skies, no rain.',
    dry: 'No rain expected.',
  },

  // Notificação diária
  notification: {
    now: (temperature: string) => `${temperature} now`,
    range: (high: string, low: string) => `high ${high} / low ${low}`,
  },

  myLocation: 'My location',

  nav: { label: 'Main navigation', now: 'NOW', cities: 'CITIES', settings: 'SETTINGS' },

  loader: {
    label: 'loading the weather',
    command: '$ jaw now',
    locating: 'locating',
    reading: 'reading the sky',
    building: 'building forecast',
  },

  now: {
    loading: 'LOADING',
    changeCity: (place: string) => `${place}, change city`,
    region: 'Weather now',
    offline: (time: string) => `offline • data from ${time}`,
    high: 'HIGH',
    low: 'LOW',
    feelsLike: (temperature: string) => `feels like ${temperature}`,
    details: 'DETAILS',
    humidity: 'HUMIDITY',
    wind: 'WIND',
    rain: 'RAIN',
    sun: 'SUN',
    next24h: 'NEXT 24H',
    next24hLabel: 'Next 24 hours',
    sevenDays: '7 DAYS →',
    nowHour: 'NOW',
    noLocation: 'NO LOCATION',
    noLocationTitle: 'NO LOCATION',
    gpsDenied: 'GPS access was denied. Search for a city, or allow location in your device settings.',
    gpsUnavailable: "Couldn't get your position right now. Try again or search for a city.",
    searchCity: 'SEARCH CITY',
    tryAgain: 'TRY AGAIN',
    error: 'ERROR',
    errorText: "couldn't load the weather.",
    errorOffline: 'No connection. Check your internet and try again.',
    errorLater: 'Try again in a moment.',
  },

  days: {
    back: '← NOW',
    title: (count: number) => `NEXT ${count} DAYS`,
    tapToOpen: 'tap to open',
    day: 'DAY',
    sky: 'SKY',
    rain: 'RAIN',
    highLow: 'HIGH LOW',
    today: 'today',
    maxWind: 'MAX WIND',
    sun: 'SUN',
  },

  cities: {
    title: 'CITIES',
    results: (count: number) => `${count} RESULTS`,
    searching: 'SEARCHING…',
    favoritesCount: (count: number) => `${count} FAVORITES`,
    searchLabel: 'SEARCH CITY',
    placeholder: 'city name',
    clear: 'clear search',
    favorites: 'FAVORITES',
    resultsTitle: 'RESULTS',
    emptyArt: '0 favorites_',
    empty: 'No favorite cities yet.',
    emptyHint: 'Search for a city and tap ☆ to pin it here.',
    favorite: (city: string) => `favorite ${city}`,
    unfavorite: (city: string) => `unfavorite ${city}`,
    remove: (city: string) => `remove ${city}`,
    searchCommand: (query: string) => `$ search "${query}"`,
    connectionError: '> connection error',
    zeroResults: '> 0 results',
    searchFailed: "Couldn't search right now.",
    notFound: 'No city found.',
    searchFailedHint: 'Check your connection and try again.',
    notFoundHint: 'Check the spelling or try the name in the local language.',
    myLocation: 'MY LOCATION',
    useGps: 'use GPS',
  },

  settings: {
    title: 'SETTINGS',
    dailyNotification: 'DAILY NOTIFICATION',
    dailySummary: 'Daily summary',
    on: 'ON',
    off: 'OFF',
    denied: 'Notification permission denied. Allow it in your device settings.',
    webOnly: "The browser doesn't send the summary; it works in the Android app.",
    time: 'Time',
    city: 'City',
    units: 'UNITS',
    temperature: 'Temperature',
    wind: 'Wind',
    theme: 'THEME',
    light: 'LIGHT',
    dark: 'DARK',
    auto: 'AUTO',
    color: 'COLOR',
    accentLabel: 'accent color',
    accents: {
      none: ['MONO', 'monochrome'],
      orange: ['ORANGE', 'orange'],
      amber: ['AMBER', 'amber'],
      green: ['GREEN', 'phosphor green'],
    },
    language: 'LANGUAGE',
    credits: 'Data: Open-Meteo, MET Norway',
  },
}

export type Messages = typeof en

/** ["a", "b", "c"] → "a, b and c" */
export function joinList(items: string[], and: string): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`
}

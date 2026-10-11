import type { Location } from './location'

export type TemperatureUnit = 'c' | 'f'
export type WindUnit = 'kmh' | 'ms' | 'mph'
export type Theme = 'light' | 'dark' | 'system'
/** `none` = monocromático (padrão). As demais adicionam uma cor de acento à paleta. */
export type Accent = 'none' | 'orange' | 'amber' | 'green'
/** Idiomas da interface. Inglês é o padrão para quem não usa português. */
export type Language = 'en' | 'pt'
/** `auto` segue o idioma do aparelho. */
export type LanguageSetting = 'auto' | Language

export interface NotificationSettings {
  enabled: boolean
  /** Horário local `HH:MM` em que o resumo do dia é enviado. */
  time: string
  /** Cidade do resumo: id de uma favorita, ou `gps` para a posição atual. */
  locationId: string
}

export interface Settings {
  temperatureUnit: TemperatureUnit
  windUnit: WindUnit
  theme: Theme
  accent: Accent
  language: LanguageSetting
  notification: NotificationSettings
}

/** Tudo o que é salvo no aparelho (@capacitor/preferences). */
export interface PersistedState {
  settings: Settings
  favorites: Location[]
  /** Localização exibida em Agora: uma cidade ou a posição do GPS. */
  selected: Location | 'gps'
}

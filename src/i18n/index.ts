import { useAppState } from '../state/context'
import type { Location } from '../types/location'
import type { Language, LanguageSetting } from '../types/settings'
import { en, type Messages } from './en'
import { pt } from './pt'

export type { Messages }

export const MESSAGES: Record<Language, Messages> = { en, pt }

/** Português para quem usa o aparelho em português; inglês para todo o resto. */
export function deviceLanguage(languages: readonly string[] = navigator.languages): Language {
  const preferred = (languages[0] ?? navigator.language ?? '').toLowerCase()
  return preferred.startsWith('pt') ? 'pt' : 'en'
}

export function resolveLanguage(setting: LanguageSetting): Language {
  return setting === 'auto' ? deviceLanguage() : setting
}

/** Idioma atual (dos ajustes ou do aparelho) e os textos dele. */
export function useI18n(): { lang: Language; t: Messages } {
  const { settings } = useAppState()
  const lang = resolveLanguage(settings.language)
  return { lang, t: MESSAGES[lang] }
}

/** Nome do lugar para exibir: a posição do GPS ganha o rótulo no idioma atual. */
export function placeName(location: Location, t: Messages): string {
  return location.id === 'gps' ? t.myLocation : location.name
}

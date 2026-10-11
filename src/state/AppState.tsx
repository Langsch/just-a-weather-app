import { Preferences } from '@capacitor/preferences'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PersistedState } from '../types/settings'
import { AppStateContext, DEFAULT_STATE, type AppStateValue } from './context'

const STORAGE_KEY = 'app-state'

async function load(): Promise<PersistedState> {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    if (!value) return DEFAULT_STATE
    const saved = JSON.parse(value) as Partial<PersistedState>
    return {
      ...DEFAULT_STATE,
      ...saved,
      settings: {
        ...DEFAULT_STATE.settings,
        ...saved.settings,
        notification: { ...DEFAULT_STATE.settings.notification, ...saved.settings?.notification },
      },
    }
  } catch {
    return DEFAULT_STATE
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState | null>(null)

  useEffect(() => {
    load().then(setState)
  }, [])

  useEffect(() => {
    if (state) Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(state) })
  }, [state])

  const update = useCallback((fn: (s: PersistedState) => PersistedState) => {
    setState((s) => (s ? fn(s) : s))
  }, [])

  const value = useMemo<AppStateValue | null>(() => {
    if (!state) return null
    return {
      ...state,
      updateSettings: (patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      select: (location) => update((s) => ({ ...s, selected: location })),
      toggleFavorite: (location) =>
        update((s) => ({
          ...s,
          favorites: s.favorites.some((f) => f.id === location.id)
            ? s.favorites.filter((f) => f.id !== location.id)
            : [...s.favorites, location],
        })),
      isFavorite: (id) => state.favorites.some((f) => f.id === id),
    }
  }, [state, update])

  // Só renderiza depois de ler o que está salvo, para não piscar o tema padrão.
  if (!value) return null
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

import { createContext, useContext } from 'react'
import type { Location } from '../types/location'
import type { PersistedState, Settings } from '../types/settings'

export const DEFAULT_STATE: PersistedState = {
  settings: {
    temperatureUnit: 'c',
    windUnit: 'kmh',
    theme: 'system',
    accent: 'none',
    language: 'auto',
    notification: { enabled: false, time: '07:00', locationId: 'gps' },
  },
  favorites: [],
  selected: 'gps',
}

export interface AppStateValue extends PersistedState {
  updateSettings: (patch: Partial<Settings>) => void
  select: (location: Location | 'gps') => void
  toggleFavorite: (location: Location) => void
  isFavorite: (id: string) => boolean
}

export const AppStateContext = createContext<AppStateValue | null>(null)

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState fora do AppStateProvider')
  return value
}

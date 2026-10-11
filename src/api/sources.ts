import type { SourceId, SourceInfo } from '../types/weather'

export const SOURCES: Record<SourceId, SourceInfo> = {
  ecmwf: { id: 'ecmwf', label: 'ECMWF', provider: 'Centro Europeu', resolutionKm: 25 },
  gfs: { id: 'gfs', label: 'GFS', provider: 'NOAA (EUA)', resolutionKm: 25 },
  icon: { id: 'icon', label: 'ICON', provider: 'DWD (Alemanha)', resolutionKm: 13 },
  meteofrance: { id: 'meteofrance', label: 'ARPEGE', provider: 'Météo-France', resolutionKm: 25 },
  metno: { id: 'metno', label: 'MET Norway', provider: 'Instituto Norueguês', resolutionKm: 9 },
}

/** Nome do modelo no parâmetro `models=` do Open-Meteo. MET Norway tem API própria. */
export const OPEN_METEO_MODELS: Partial<Record<SourceId, string>> = {
  ecmwf: 'ecmwf_ifs025',
  gfs: 'gfs_seamless',
  icon: 'icon_seamless',
  meteofrance: 'meteofrance_seamless',
}

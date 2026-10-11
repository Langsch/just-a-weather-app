import type { Location } from '../types/location'
import type { ConsensusForecast, SourceId } from '../types/weather'
import { buildConsensus } from '../consensus/consensus'
import { fetchMetno } from './metno'
import { fetchOpenMeteo, isOpenMeteoSource } from './openMeteo'

/** Fontes usadas no consenso. Escolha interna, não exposta ao usuário. */
export const DEFAULT_SOURCES: SourceId[] = ['ecmwf', 'gfs', 'icon', 'meteofrance', 'metno']

/** Busca todas as fontes em paralelo e combina. Lança `NoSourcesError` se nenhuma responder. */
export async function getForecast(
  location: Location,
  sources: SourceId[] = DEFAULT_SOURCES,
  signal?: AbortSignal,
): Promise<ConsensusForecast> {
  const [openMeteo, metno] = await Promise.all([
    fetchOpenMeteo(location, sources.filter(isOpenMeteoSource), signal),
    sources.includes('metno') ? fetchMetno(location, signal) : null,
  ])
  return buildConsensus(location, metno ? [...openMeteo, metno] : openMeteo)
}

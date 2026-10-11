export interface Location {
  /** Estável entre sessões: id do geocoding ou `gps` para a posição atual. */
  id: string
  name: string
  /** Estado / província, quando o geocoding informar. */
  region?: string
  country: string
  latitude: number
  longitude: number
  /** IANA, ex.: `America/Sao_Paulo`. Todos os horários da previsão são locais deste fuso. */
  timezone: string
}

import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

const TICK_MS = 160
const BAR = 16

export type LoaderStage = 'locating' | 'fetching'

/** Faixa da barra em cada etapa: localizar vai até 40%, buscar a previsão até 95%. */
const RANGE: Record<LoaderStage, [number, number]> = { locating: [0, 40], fetching: [40, 95] }

/**
 * Carregamento estilo terminal: nuvem ASCII andando, log e barra de progresso.
 * A barra anda sozinha dentro da faixa da etapa atual (use `key={stage}` para reiniciar).
 */
export function Loader({ stage }: { stage: LoaderStage }) {
  const { t } = useI18n()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const [from, to] = RANGE[stage]
  const pct = Math.round(from + (to - from) * (1 - Math.exp(-tick / 12)))
  const fetching = stage === 'fetching'
  const fill = Math.floor((pct * BAR) / 100)
  const pad = ' '.repeat(Math.floor(tick / 2) % 14)
  const cursor = Math.floor(tick / 3) % 2 === 0 ? '█' : ' '

  const cloud = [`${pad}     .--.`, `${pad}  .-(    ).`, `${pad} (___.__)__)`, `${pad}   '  '  '`].join('\n')
  // `> localizando ....... ok`: os pontos alinham o status na mesma coluna.
  const step = (label: string, done: boolean) => `> ${`${label} `.padEnd(19, '.')} ${done ? 'ok' : '..'}`
  const log = [
    t.loader.command,
    step(t.loader.locating, fetching),
    step(t.loader.reading, fetching && pct > 70),
    step(t.loader.building, false),
    `$ ${cursor}`,
  ].join('\n')
  const bar = `[${'█'.repeat(fill)}${'░'.repeat(BAR - fill)}] ${String(pct).padStart(3, ' ')}%`

  return (
    <div className="state" role="status" aria-label={t.loader.label}>
      <pre className="state__art accent" aria-hidden="true">
        {cloud}
      </pre>
      <pre className="loader__log" aria-hidden="true">
        {log}
      </pre>
      <pre className="loader__log accent" aria-hidden="true">
        {bar}
      </pre>
    </div>
  )
}

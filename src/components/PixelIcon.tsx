import { useI18n } from '../i18n'
import { GLYPHS, type Glyph } from './glyphs'

interface Props {
  glyph: Glyph
  /** Sempre múltiplo de 16 para os pixels ficarem nítidos. */
  size?: number
  /** Usa a cor de acento (com brilho no tema escuro). */
  accent?: boolean
  /** Ícone decorativo, ao lado de um texto que já diz a mesma coisa. */
  decorative?: boolean
}

export function PixelIcon({ glyph, size = 32, accent = false, decorative = false }: Props) {
  const { t } = useI18n()
  return (
    <span className={accent ? 'pixel-icon pixel-icon--accent' : 'pixel-icon'}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': t.glyphs[glyph] })}
      >
        <path d={GLYPHS[glyph]} fill="currentColor" />
      </svg>
    </span>
  )
}

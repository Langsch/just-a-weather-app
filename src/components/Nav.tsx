import { useI18n } from '../i18n'
import { PixelIcon } from './PixelIcon'
import type { Glyph } from './glyphs'

export type Tab = 'now' | 'cities' | 'settings'

const ITEMS: { tab: Tab; glyph: Glyph }[] = [
  { tab: 'now', glyph: 'clear' },
  { tab: 'cities', glyph: 'nav-cidades' },
  { tab: 'settings', glyph: 'nav-ajustes' },
]

export function Nav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const { t } = useI18n()
  return (
    <nav className="nav" aria-label={t.nav.label}>
      {ITEMS.map(({ tab, glyph }) => {
        const current = tab === active
        const label = t.nav[tab]
        return (
          <button
            key={tab}
            type="button"
            className="nav__item"
            aria-current={current ? 'page' : undefined}
            onClick={() => onChange(tab)}
          >
            <span className="nav__chip">
              {current ? <span className="nav__mark" /> : <PixelIcon glyph={glyph} size={16} decorative />}
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

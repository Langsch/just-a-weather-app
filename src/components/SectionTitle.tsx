const RULE = '─'.repeat(60)

/** `-=< FICHA >=- ──────` : a linha corta no fim do container. */
export function SectionTitle({ children, as: Tag = 'h2' }: { children: string; as?: 'h2' | 'div' }) {
  return (
    <Tag className="section-title">
      -=&lt; {children} &gt;=- <span aria-hidden="true">{RULE}</span>
    </Tag>
  )
}

import { describe, expect, it } from 'vitest'
import { MESSAGES, deviceLanguage } from '.'

describe('deviceLanguage', () => {
  it('usa português para qualquer variante de português', () => {
    expect(deviceLanguage(['pt-BR', 'en-US'])).toBe('pt')
    expect(deviceLanguage(['pt-PT'])).toBe('pt')
    expect(deviceLanguage(['PT'])).toBe('pt')
  })

  it('usa inglês para todo o resto', () => {
    expect(deviceLanguage(['en-US'])).toBe('en')
    expect(deviceLanguage(['es-ES', 'pt-BR'])).toBe('en')
    expect(deviceLanguage(['de'])).toBe('en')
  })
})

describe('mensagens', () => {
  it('português tem as mesmas chaves que o inglês', () => {
    const keys = (o: object, prefix = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
      )
    expect(keys(MESSAGES.pt).sort()).toEqual(keys(MESSAGES.en).sort())
  })
})

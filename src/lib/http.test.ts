import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithTimeout } from './http'

describe('fetchWithTimeout', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('rejeita quando a resposta não chega a tempo', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => {}))
    await expect(fetchWithTimeout('https://x', {}, 20)).rejects.toThrow('Tempo esgotado')
  })

  it('devolve a resposta quando chega a tempo', async () => {
    vi.stubGlobal('fetch', async () => new Response('ok'))
    const response = await fetchWithTimeout('https://x', {}, 1000)
    expect(await response.text()).toBe('ok')
  })
})

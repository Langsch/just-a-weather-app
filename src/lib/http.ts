export const SOURCE_TIMEOUT_MS = 10_000

/**
 * fetch com tempo máximo. Uma fonte lenta não pode travar a previsão inteira:
 * estourou o tempo, ela vira erro e o consenso segue com as outras.
 * O Promise.race garante o limite mesmo onde o abort não é respeitado (ex.: CapacitorHttp).
 */
export function fetchWithTimeout(
  url: string,
  init: RequestInit & { signal?: AbortSignal } = {},
  ms = SOURCE_TIMEOUT_MS,
): Promise<Response> {
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), ms)
  const signal = init.signal ? AbortSignal.any([init.signal, timeout.signal]) : timeout.signal

  const expired = new Promise<never>((_, reject) => {
    timeout.signal.addEventListener('abort', () => reject(new Error(`Tempo esgotado (${ms / 1000}s)`)))
  })
  return Promise.race([fetch(url, { ...init, signal }), expired]).finally(() => clearTimeout(timer))
}

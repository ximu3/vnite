import { net } from 'electron'
import { ScraperError, normalizeScraperError } from './errors'

/**
 * Creates a fetch function with a shared timeout and normalized scraper errors.
 * A caller-provided abort signal is combined with the timeout signal without changing its origin.
 */
export function createScraperFetch(
  timeout = 10_000
): (url: string, options?: RequestInit) => Promise<Response> {
  return async (url: string, options?: RequestInit): Promise<Response> => {
    const timeoutSignal = AbortSignal.timeout(timeout)
    const signal = options?.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal

    try {
      const response = await net.fetch(url, {
        ...options,
        signal
      })
      if (!response.ok) {
        throw new ScraperError('httpError', undefined, response.status)
      }
      return response
    } catch (error) {
      throw normalizeScraperError(error)
    }
  }
}

export async function readScraperJson<T = any>(response: Response): Promise<T> {
  try {
    return await response.json()
  } catch (error) {
    if (error instanceof SyntaxError) throw new ScraperError('unknown', error)
    throw normalizeScraperError(error)
  }
}

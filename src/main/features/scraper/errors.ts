import log from 'electron-log/main'
import i18next from 'i18next'

export type ScraperErrorCategory = 'network' | 'timeout' | 'httpError' | 'unknown'

export class ScraperError extends Error {
  constructor(
    public readonly category: ScraperErrorCategory,
    public readonly cause?: unknown,
    public readonly httpStatus?: number
  ) {
    super(i18next.t(`scraper:errors.${category}`, { httpStatus }))
    this.name = 'ScraperError'
  }
}

export function isHttpError(error: unknown, httpStatus?: number): boolean {
  return (
    error instanceof ScraperError &&
    error.category === 'httpError' &&
    (httpStatus === undefined || error.httpStatus === httpStatus)
  )
}

export function normalizeScraperError(error: unknown): ScraperError {
  if (error instanceof ScraperError) return error
  const visited = new Set<unknown>()
  let current = error
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current)
    const detail = current as {
      code?: unknown
      name?: unknown
      message?: unknown
      cause?: unknown
      status?: unknown
      statusCode?: unknown
    }

    // Check HTTP status
    const httpStatus = detail.status ?? detail.statusCode
    if (
      typeof httpStatus === 'number' &&
      Number.isInteger(httpStatus) &&
      httpStatus >= 300 &&
      httpStatus <= 599
    ) {
      return new ScraperError('httpError', error, httpStatus)
    }

    // Check error code or message
    const code = typeof detail.code === 'string' ? detail.code : ''
    const message = typeof detail.message === 'string' ? detail.message : ''
    if (
      /^(ETIMEDOUT|ESOCKETTIMEDOUT|UND_ERR_(CONNECT|HEADERS|BODY)_TIMEOUT)$/.test(code) ||
      detail.name === 'TimeoutError' ||
      /net::ERR_(CONNECTION_)?TIMED_OUT\b/.test(message)
    ) {
      return new ScraperError('timeout', error)
    }
    if (
      /^(ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|ENETUNREACH|EHOSTUNREACH|EPIPE|CERT_HAS_EXPIRED|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE|ERR_TLS_CERT_ALTNAME_INVALID|UND_ERR_SOCKET)$/.test(
        code
      ) ||
      /net::ERR_(CONNECTION_[A-Z_]+|NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|PROXY_[A-Z_]+|TUNNEL_CONNECTION_FAILED|SSL_[A-Z_]+|CERT_[A-Z_]+|NETWORK_CHANGED)\b/.test(
        message
      )
    ) {
      return new ScraperError('network', error)
    }
    current = detail.cause
  }
  return new ScraperError('unknown', error)
}

const loggedErrors = new WeakSet<object>()

export function logScraperError(
  error: unknown,
  source: string,
  operation: string,
  level: 'warn' | 'error' = 'error'
): ScraperError {
  const failure = normalizeScraperError(error)
  const identity = failure.cause && typeof failure.cause === 'object' ? failure.cause : failure
  if (!loggedErrors.has(identity)) {
    loggedErrors.add(identity)
    log[level]('[Scraper]', {
      source,
      operation,
      category: failure.category,
      httpStatus: failure.httpStatus,
      stack: failure.cause instanceof Error ? failure.cause.stack : failure.stack
    })
  }
  return failure
}

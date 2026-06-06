import { BrowserWindow, net } from 'electron'
import log from 'electron-log/main'

import { delay } from './common'

const REGEX = /\["(\bhttps?:\/\/[^"]+)",(\d+),(\d+)\],null/g
const GOOGLE_IMAGE_SEARCH_BASE_URL = 'https://www.google.com/search'
const GOOGLE_IMAGE_SEARCH_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'

// Challenge warm-up
const GOOGLE_IMAGE_SEARCH_CHALLENGE_TIMEOUT_MS = 30_000
const GOOGLE_IMAGE_SEARCH_CHALLENGE_POLL_INTERVAL_MS = 1_000
const GOOGLE_IMAGE_SEARCH_POST_VERIFY_DELAY_MS = 750
const GOOGLE_IMAGE_SEARCH_CHALLENGE_URL = `${GOOGLE_IMAGE_SEARCH_BASE_URL}?${new URLSearchParams({
  udm: '2',
  tbm: 'isch',
  q: 'google'
}).toString()}`

let googleChallengePromise: Promise<void> | null = null

const unicodeToString = (content: string): string =>
  content.replace(/\\u[\dA-F]{4}/gi, (match) =>
    String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
  )

export interface Result {
  url: string
  height: number
  width: number
  color?: [number, number, number]
}

export interface Options {
  query?: Record<string, string>
}

export async function gis(searchTerm: string, options: Options = {}): Promise<Result[]> {
  if (!searchTerm || typeof searchTerm !== 'string') {
    throw new TypeError('searchTerm must be a string.')
  }

  if (!options || typeof options !== 'object') {
    throw new TypeError('options parameter must be an object.')
  }

  const { query = {} } = options
  const searchUrl = `${GOOGLE_IMAGE_SEARCH_BASE_URL}?${new URLSearchParams({
    ...query,
    udm: '2',
    tbm: 'isch',
    q: searchTerm
  }).toString()}`

  let { response, body } = await fetchGoogleImageSearchPage(searchUrl)
  if (!response.ok) {
    throw new Error(`Google image search request failed with status ${response.status}`)
  }

  let results = extractGoogleImageSearchResults(body)
  if (results.length === 0) {
    log.warn(
      `[GIS] Google image search returned no image results for search term "${searchTerm}". A challenge page may have been returned, so session verification will be attempted.`
    )
    await ensureGoogleChallengeResolved()
    await delay(GOOGLE_IMAGE_SEARCH_POST_VERIFY_DELAY_MS)
    ;({ response, body } = await fetchGoogleImageSearchPage(searchUrl))
    results = extractGoogleImageSearchResults(body)
  }

  return results
}

export async function primeGoogleImageSearchSession(): Promise<void> {
  try {
    const { response, body } = await fetchGoogleImageSearchPage(GOOGLE_IMAGE_SEARCH_CHALLENGE_URL)

    if (!response.ok) {
      log.warn(
        `[GIS] Google image search warm-up request returned status ${response.status}. Skipping verification.`
      )
      return
    }

    const results = extractGoogleImageSearchResults(body)
    if (results.length > 0) {
      log.info(`[GIS] Google image search warm-up completed without challenge.`)
      return
    }

    log.info('[GIS] Google image search warm-up returned no image results. Opening helper window.')
    await ensureGoogleChallengeResolved()
    log.info('[GIS] Google image search warm-up completed after session verification.')
  } catch (error) {
    log.warn(`[GIS] Google image search warm-up failed: ${String(error)}`)
  }
}

async function fetchGoogleImageSearchPage(
  url: string
): Promise<{ response: Response; body: string }> {
  const response = await net.fetch(url, {
    headers: {
      'User-Agent': GOOGLE_IMAGE_SEARCH_USER_AGENT
    }
  })

  return {
    response,
    body: await response.text()
  }
}

function extractGoogleImageSearchResults(content: string): Result[] {
  // Clone the global regex so each parse starts with a fresh lastIndex.
  const pattern = new RegExp(REGEX)
  const results: Result[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    results.push({
      url: unicodeToString(match[1]),
      height: +match[2],
      width: +match[3]
    })
  }

  return results
}

async function ensureGoogleChallengeResolved(): Promise<void> {
  if (!googleChallengePromise) {
    googleChallengePromise = resolveGoogleChallenge().finally(() => {
      googleChallengePromise = null
    })
  }

  return googleChallengePromise
}

async function resolveGoogleChallenge(): Promise<void> {
  const helperWindow = new BrowserWindow({
    width: 640,
    height: 860,
    show: false,
    webPreferences: {
      sandbox: false,
      backgroundThrottling: false
    }
  })

  try {
    await loadGoogleVerificationUrl(helperWindow)

    const timeoutAt = Date.now() + GOOGLE_IMAGE_SEARCH_CHALLENGE_TIMEOUT_MS

    while (Date.now() < timeoutAt) {
      if (helperWindow.isDestroyed()) {
        throw new Error('Google verification window was closed before the challenge completed')
      }

      let hasResults = false
      try {
        const content = await helperWindow.webContents.executeJavaScript(
          `(() => document.documentElement?.outerHTML || '')()`,
          true
        )
        hasResults = new RegExp(REGEX).test(content)
      } catch {
        hasResults = false
      }

      if (hasResults) {
        log.info(`[GIS] Google session verification completed.`)
        return
      }

      await delay(GOOGLE_IMAGE_SEARCH_CHALLENGE_POLL_INTERVAL_MS)
    }

    throw new Error(`Timed out waiting for Google challenge page to resolve.`)
  } finally {
    if (!helperWindow.isDestroyed()) {
      helperWindow.close()
    }
  }
}

async function loadGoogleVerificationUrl(helperWindow: BrowserWindow): Promise<void> {
  try {
    await helperWindow.loadURL(GOOGLE_IMAGE_SEARCH_CHALLENGE_URL, {
      userAgent: GOOGLE_IMAGE_SEARCH_USER_AGENT
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('ERR_ABORTED')) {
      // Google may interrupt the initial navigation with a redirect while the verification page is loading.
      return
    }

    throw error
  }
}

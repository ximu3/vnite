import { GameList, GameMetadata } from '@appTypes/utils'
import i18next from 'i18next'
import { formatDate } from '~/utils'
import { isHttpError, logScraperError } from '../../errors'
import { createScraperFetch, readScraperJson } from '../../request'
import {
  SteamAppDetailsData,
  SteamAppDetailsResponse,
  SteamLanguageConfig,
  SteamStoreSearchResponse
} from './types'

const fetch = createScraperFetch()

// Define base URL constants
const STEAM_URLS = {
  STORE: 'https://store.steampowered.com',
  CDN: 'https://steamcdn-a.akamaihd.net',
  COMMUNITY: 'https://steamcommunity.com',
  CLOUDFLARE: 'https://cdn.cloudflare.steamstatic.com'
}

// `cc` only affects store visibility, so no i18n-specific handling is needed.
const STEAM_FALLBACK_COUNTRY_CODES = ['HK', 'US', 'JP']
const STEAM_APP_DETAILS_CACHE_TTL = 5 * 60 * 1000
const STEAM_APP_DETAILS_CACHE_LIMIT = 100

type SteamAppDetailsCacheEntry = {
  data: SteamAppDetailsData
  expiresAt: number
}

const steamAppCountryCodeCache: Record<string, string> = {}
const steamAppDetailsCache: Record<string, SteamAppDetailsCacheEntry> = {}

async function fetchSteamAPI(url: string): Promise<any> {
  const response = await fetch(url)
  return readScraperJson(response)
}

function getCandidateCountryCodes(
  preferredCountryCodes: readonly (string | undefined)[]
): string[] {
  return Array.from(
    new Set(
      [...preferredCountryCodes, ...STEAM_FALLBACK_COUNTRY_CODES].filter(
        (countryCode): countryCode is string => Boolean(countryCode)
      )
    )
  )
}

function getCachedSteamAppDetails(
  appId: string,
  language: string
): SteamAppDetailsData | undefined {
  const cacheKey = `${appId}:${language}`
  const cachedDetails = steamAppDetailsCache[cacheKey]

  if (!cachedDetails) return undefined

  if (cachedDetails.expiresAt <= Date.now()) {
    delete steamAppDetailsCache[cacheKey]
    return undefined
  }

  return cachedDetails.data
}

function cacheSteamAppDetails(appId: string, language: string, data: SteamAppDetailsData): void {
  const now = Date.now()
  const cacheKey = `${appId}:${language}`
  steamAppDetailsCache[cacheKey] = {
    data,
    expiresAt: now + STEAM_APP_DETAILS_CACHE_TTL
  }

  Object.entries(steamAppDetailsCache).forEach(([key, cachedDetails]) => {
    if (cachedDetails.expiresAt <= now) {
      delete steamAppDetailsCache[key]
    }
  })

  const cacheEntries = Object.entries(steamAppDetailsCache)
  if (cacheEntries.length <= STEAM_APP_DETAILS_CACHE_LIMIT) return

  cacheEntries
    .sort(([, first], [, second]) => first.expiresAt - second.expiresAt)
    .slice(0, cacheEntries.length - STEAM_APP_DETAILS_CACHE_LIMIT)
    .forEach(([key]) => delete steamAppDetailsCache[key])
}

async function resolveSteamAppDetails(
  appId: string,
  language: string
): Promise<SteamAppDetailsData | null> {
  const cachedDetails = getCachedSteamAppDetails(appId, language)
  if (cachedDetails) return cachedDetails

  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig
  const cachedCountryCode = steamAppCountryCodeCache[appId]
  const errors: unknown[] = []

  for (const countryCode of getCandidateCountryCodes([cachedCountryCode, langConfig.countryCode])) {
    try {
      const url = `${STEAM_URLS.STORE}/api/appdetails?appids=${appId}&l=${language}&cc=${countryCode}`
      const response = (await fetchSteamAPI(url)) as SteamAppDetailsResponse
      const result = response[appId]

      if (result?.success && result.data) {
        steamAppCountryCodeCache[appId] = countryCode
        cacheSteamAppDetails(appId, language, result.data)
        errors.forEach((error) => logScraperError(error, 'Steam', 'region fallback', 'warn'))
        return result.data
      }

      if (countryCode === cachedCountryCode) {
        delete steamAppCountryCodeCache[appId]
      }
    } catch (error) {
      // Try the next region without treating a failed request as an unavailable app.
      errors.push(error)
    }
  }

  if (errors.length) throw errors[errors.length - 1]
  return null
}

export async function searchSteamGames(gameName: string): Promise<GameList> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  const candidateCountryCodes = getCandidateCountryCodes([langConfig.countryCode])
  const urlBase = `${STEAM_URLS.STORE}/api/storesearch/?term=${encodeURIComponent(
    gameName
  )}&l=${langConfig.apiLanguageCode || 'english'}`

  const errors: unknown[] = []
  const resultsPerRegion = await Promise.all(
    candidateCountryCodes.map(async (countryCode) => {
      const url = `${urlBase}&cc=${countryCode}`
      try {
        const response = (await fetchSteamAPI(url)) as SteamStoreSearchResponse
        return {
          countryCode,
          items: response.items || []
        }
      } catch (err) {
        errors.push(err)
        return { countryCode, items: [] }
      }
    })
  )

  const merged: Record<number, SteamStoreSearchResponse['items'][number]> = {}
  resultsPerRegion.forEach(({ countryCode, items }) => {
    items.forEach((game) => {
      if (!merged[game.id]) {
        merged[game.id] = game
        steamAppCountryCodeCache[game.id.toString()] = countryCode
      }
    })
  })

  if (Object.keys(merged).length === 0) {
    if (errors.length) throw errors[errors.length - 1]
    return []
  }

  errors.forEach((error) => logScraperError(error, 'Steam', 'search region fallback', 'warn'))
  const gamesMetadata = await Promise.all(
    Object.values(merged).map((game) =>
      getSteamMetadata(game.id.toString()).catch((error) => {
        logScraperError(error, 'Steam', 'search enrichment', 'warn')
      })
    )
  )

  return Object.values(merged).map((game, index) => ({
    id: game.id.toString(),
    name: game.name,
    releaseDate: gamesMetadata[index]?.releaseDate || '',
    developers: gamesMetadata[index]?.developers || []
  }))
}

async function fetchStoreTags(appId: string): Promise<string[]> {
  try {
    const langConfig = i18next.t('scraper:steam.config', {
      returnObjects: true
    }) as SteamLanguageConfig

    const url = `${STEAM_URLS.STORE}/app/${appId}`

    const response = await fetch(url, {
      headers: {
        'Accept-Language': langConfig.acceptLanguageHeader || 'en-US,en;q=0.9'
      }
    })

    const html = await response.text()

    // Simple regex-based tag extraction method
    const tagMatches = html.match(/class="app_tag"[^>]*>([^<]+)<\/a>/g) || []
    const tags: string[] = []

    tagMatches.forEach((match) => {
      const tagMatch = match.match(/>([^<]+)<\/a>/)
      if (tagMatch && tagMatch[1]) {
        const tag = tagMatch[1].trim()
        if (tag && tag !== '+') {
          tags.push(tag)
        }
      }
    })

    return tags
  } catch (error) {
    logScraperError(error, 'Steam', 'store tags', 'warn')
    return []
  }
}

export async function getSteamMetadata(appId: string): Promise<GameMetadata | null> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  const language = langConfig.apiLanguageCode || 'english'

  // Determine if we need to get the original English name (if current language is not English)
  const needsOriginalName = language !== 'english'
  const localResult = await resolveSteamAppDetails(appId, language)

  if (!localResult) return null

  const gameData = localResult
  const englishResult = needsOriginalName
    ? await resolveSteamAppDetails(appId, 'english')
    : localResult
  const originalName = englishResult?.name || gameData.name

  const tags = await fetchStoreTags(appId)

  return {
    name: gameData.name,
    originalName,
    releaseDate: formatDate(gameData?.release_date?.date || ''),
    description:
      gameData.detailed_description || gameData.about_the_game || gameData.short_description || '',
    developers: gameData.developers || [],
    publishers: gameData.publishers,
    genres: gameData.genres?.map((genre) => genre.description) || [],
    relatedSites: [
      ...(gameData.website
        ? [{ label: i18next.t('scraper:steam.officialWebsite'), url: gameData.website }]
        : []),
      ...(gameData.metacritic?.url ? [{ label: 'Metacritic', url: gameData.metacritic.url }] : []),
      {
        label: i18next.t('scraper:steam.steamStore'),
        url: `${STEAM_URLS.STORE}/app/${appId}`
      }
    ],
    tags: tags.length > 0 ? tags : gameData.genres?.map((genre) => genre.description) || [],
    platforms: gameData.platforms
      ? Object.keys(gameData.platforms).filter(
          (platform) => gameData.platforms && gameData.platforms[platform]
        )
      : []
  }
}

export async function getSteamMetadataByName(gameName: string): Promise<GameMetadata | null> {
  const games = await searchSteamGames(gameName)
  if (games.length === 0) return null
  return await getSteamMetadata(games[0].id)
}

async function isSteamImageAvailable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD' // Only get header information, don't download the actual image content
    })
    return response.status === 200
  } catch (error) {
    if (!isHttpError(error, 404)) {
      logScraperError(error, 'Steam', 'check image', 'warn')
    }
    return false
  }
}

export async function getGameHero(appId: string): Promise<string> {
  const candidateUrls = [
    `${STEAM_URLS.CDN}/steam/apps/${appId}/library_hero_2x.jpg`,
    `${STEAM_URLS.CDN}/steam/apps/${appId}/library_hero.jpg`
  ]

  for (const url of candidateUrls) {
    if (await isSteamImageAvailable(url)) {
      return url
    }
  }

  return ''
}

export async function getGameScreenshots(appId: string): Promise<string[]> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  const result = await resolveSteamAppDetails(appId, langConfig.apiLanguageCode || 'english')
  return result?.screenshots?.map((screenshot) => screenshot.path_full) || []
}

export async function getGameHeader(appId: string): Promise<string> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  const result = await resolveSteamAppDetails(appId, langConfig.apiLanguageCode || 'english')

  // Steam appdetails exposes the store header capsule URL as header_image.
  return result?.header_image || ''
}

export async function getGameBackgrounds(appId: string): Promise<string[]> {
  const heroUrl = await getGameHero(appId)
  const screenshots = await getGameScreenshots(appId)

  return heroUrl ? [heroUrl, ...screenshots] : screenshots
}

export async function getGameCover(appId: string): Promise<string> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  const candidateUrl = [
    ...(langConfig.apiLanguageCode
      ? [
          `${STEAM_URLS.CDN}/steam/apps/${appId}/library_600x900_${langConfig.apiLanguageCode}_2x.jpg`,
          `${STEAM_URLS.CDN}/steam/apps/${appId}/library_600x900_${langConfig.apiLanguageCode}.jpg`
        ]
      : []),
    `${STEAM_URLS.CDN}/steam/apps/${appId}/library_600x900_2x.jpg`,
    `${STEAM_URLS.CDN}/steam/apps/${appId}/library_600x900.jpg`
  ]

  // Try all candidate URLs and return the first one that exists
  for (const url of candidateUrl) {
    if (await isSteamImageAvailable(url)) return url
  }

  // Some newer games use hashed asset paths rather than the standard Steam CDN
  // naming pattern. Return an empty string here so api.ts can convert it to `[]`
  // instead of surfacing a broken URL to the renderer.
  // TODO: Investigate whether the hashed asset URL can be resolved reliably.
  return ''
}

export async function getGameLogo(appId: string): Promise<string> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  const candidateUrl = [
    ...(langConfig.apiLanguageCode
      ? [
          `${STEAM_URLS.CDN}/steam/apps/${appId}/logo_${langConfig.apiLanguageCode}_2x.png`,
          `${STEAM_URLS.CDN}/steam/apps/${appId}/logo_${langConfig.apiLanguageCode}.png`
        ]
      : []),
    `${STEAM_URLS.CDN}/steam/apps/${appId}/logo_2x.png`,
    `${STEAM_URLS.CDN}/steam/apps/${appId}/logo.png`
  ]

  // Try all candidate URLs and return the first one that exists
  for (const url of candidateUrl) {
    if (await isSteamImageAvailable(url)) return url
  }

  return ''
}

export async function checkSteamGameExists(appId: string): Promise<boolean> {
  return Boolean(await resolveSteamAppDetails(appId, 'english'))
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  const games = await searchSteamGames(gameName)
  if (games.length === 0) return ''
  return getGameCover(games[0].id)
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  const games = await searchSteamGames(gameName)
  if (games.length === 0) return []
  return getGameBackgrounds(games[0].id)
}

export async function getGameHeaderByName(gameName: string): Promise<string> {
  const games = await searchSteamGames(gameName)
  if (games.length === 0) return ''
  return getGameHeader(games[0].id)
}

export async function getGameLogoByName(gameName: string): Promise<string> {
  const games = await searchSteamGames(gameName)
  if (games.length === 0) return ''
  return getGameLogo(games[0].id)
}

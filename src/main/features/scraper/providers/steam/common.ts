import { GameList, GameMetadata } from '@appTypes/utils'
import { net } from 'electron'
import i18next from 'i18next'
import { formatDate } from '~/utils'
import { SteamAppDetailsResponse, SteamLanguageConfig, SteamStoreSearchResponse } from './types'

// Define base URL constants
const STEAM_URLS = {
  STORE: 'https://store.steampowered.com',
  CDN: 'https://steamcdn-a.akamaihd.net',
  COMMUNITY: 'https://steamcommunity.com',
  CLOUDFLARE: 'https://cdn.cloudflare.steamstatic.com'
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await net.fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function fetchSteamAPI(url: string): Promise<any> {
  const response = await fetchWithTimeout(url)
  return response.json()
}

export async function searchSteamGames(gameName: string): Promise<GameList> {
  try {
    const langConfig = i18next.t('scraper:steam.config', {
      returnObjects: true
    }) as SteamLanguageConfig

    const candidateCC = new Set([langConfig.countryCode, 'HK', 'US', 'JP'].filter(Boolean))
    const urlBase = `${STEAM_URLS.STORE}/api/storesearch/?term=${encodeURIComponent(
      gameName
    )}&l=${langConfig.apiLanguageCode || 'english'}`

    const resultsPerRegion = await Promise.all(
      Array.from(candidateCC).map(async (cc) => {
        const url = `${urlBase}&cc=${cc}`
        try {
          const response = (await fetchSteamAPI(url)) as SteamStoreSearchResponse
          if (!response.items || response.items.length === 0) return []
          return response.items
        } catch (err) {
          console.error(`Error fetching region ${cc}:`, err)
          return []
        }
      })
    )

    const merged: Record<number, SteamStoreSearchResponse['items'][number]> = {}
    resultsPerRegion.flat().forEach((game) => {
      if (!merged[game.id]) merged[game.id] = game
    })

    if (Object.keys(merged).length === 0) {
      throw new Error('No games found')
    }

    const gamesMetadata = await Promise.all(
      Object.values(merged).map((game) =>
        getSteamMetadata(game.id.toString()).catch((error) => {
          console.error(`Error fetching metadata for game ${game.id}:`, error)
        })
      )
    )

    return Object.values(merged).map((game, index) => ({
      id: game.id.toString(),
      name: game.name,
      releaseDate: gamesMetadata[index]?.releaseDate || '',
      developers: gamesMetadata[index]?.developers || []
    }))
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No games found') {
        return []
      }
      console.error('Error fetching Steam games:', error.message)
      throw error
    }
    throw new Error('An unknown error occurred')
  }
}

async function fetchStoreTags(appId: string): Promise<string[]> {
  try {
    const langConfig = i18next.t('scraper:steam.config', {
      returnObjects: true
    }) as SteamLanguageConfig

    const url = `${STEAM_URLS.STORE}/app/${appId}`

    const response = await fetchWithTimeout(url, {
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
    console.error('Error fetching store tags:', error)
    return []
  }
}

export async function getSteamMetadata(appId: string): Promise<GameMetadata> {
  try {
    const langConfig = i18next.t('scraper:steam.config', {
      returnObjects: true
    }) as SteamLanguageConfig

    // Get data in the current language
    const urlLocal = `${STEAM_URLS.STORE}/api/appdetails?appids=${appId}&l=${langConfig.apiLanguageCode || 'english'}`

    // Determine if we need to get the original English name (if current language is not English)
    const needsOriginalName = langConfig.apiLanguageCode !== 'english'

    let localData: SteamAppDetailsResponse
    let englishData: SteamAppDetailsResponse | null = null

    if (needsOriginalName) {
      // Fetch local language and English data in parallel
      ;[localData, englishData] = await Promise.all([
        fetchSteamAPI(urlLocal),
        fetchSteamAPI(`${STEAM_URLS.STORE}/api/appdetails?appids=${appId}&l=english`)
      ])
    } else {
      // Only fetch one language
      localData = await fetchSteamAPI(urlLocal)
      englishData = localData // Reuse if current language is English
    }

    if (!localData[appId].success) {
      throw new Error(`No game found with ID: ${appId}`)
    }

    const gameData = localData[appId].data
    const originalName =
      englishData && englishData[appId].success ? englishData[appId].data.name : gameData.name

    const tags = await fetchStoreTags(appId)

    return {
      name: gameData.name,
      originalName,
      releaseDate: formatDate(gameData?.release_date?.date || ''),
      description:
        gameData.detailed_description ||
        gameData.about_the_game ||
        gameData.short_description ||
        '',
      developers: gameData.developers || [],
      publishers: gameData.publishers,
      genres: gameData.genres?.map((genre) => genre.description) || [],
      relatedSites: [
        ...(gameData.website
          ? [{ label: i18next.t('scraper:steam.officialWebsite'), url: gameData.website }]
          : []),
        ...(gameData.metacritic?.url
          ? [{ label: 'Metacritic', url: gameData.metacritic.url }]
          : []),
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
  } catch (error) {
    console.error(`Error fetching metadata for game ${appId}:`, error)
    throw error
  }
}

export async function getSteamMetadataByName(gameName: string): Promise<GameMetadata> {
  try {
    const games = await searchSteamGames(gameName)
    if (games.length === 0) {
      return {
        name: gameName,
        originalName: gameName,
        releaseDate: '',
        description: '',
        developers: [],
        relatedSites: [],
        tags: []
      }
    }
    return await getSteamMetadata(games[0].id)
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameName}:`, error)
    throw error
  }
}

export async function checkImageExists(url: string): Promise<boolean> {
  try {
    const response = await net.fetch(url, {
      method: 'HEAD' // Only get header information, don't download the actual image content
    })

    // Check if status code is 200
    return response.status === 200
  } catch (error) {
    console.error(`Failed to check image: ${url}`, error)
    return false
  }
}

export async function getGameHero(appId: string): Promise<string> {
  const hdUrl = `${STEAM_URLS.CDN}/steam/apps/${appId}/library_hero_2x.jpg`
  const standardUrl = `${STEAM_URLS.CDN}/steam/apps/${appId}/library_hero.jpg`

  // Check if HD image exists
  const hdExists = await checkImageExists(hdUrl)

  // If HD image exists, return HD image URL, otherwise return standard image URL
  return hdExists ? hdUrl : standardUrl
}

export async function getGameScreenshots(appId: string): Promise<string[]> {
  const langConfig = i18next.t('scraper:steam.config', {
    returnObjects: true
  }) as SteamLanguageConfig

  // Get data in the current language
  const urlLocal = `${STEAM_URLS.STORE}/api/appdetails?appids=${appId}&l=${langConfig.apiLanguageCode || 'english'}`

  const data = (await fetchSteamAPI(urlLocal)) as SteamAppDetailsResponse
  return data[appId]?.success
    ? data[appId].data.screenshots?.map((screenshot) => screenshot.path_full) || []
    : []
}

export async function getGameBackgrounds(appId: string): Promise<string[]> {
  const heroUrl = await getGameHero(appId)
  const screenshots = await getGameScreenshots(appId)

  return [heroUrl, ...screenshots]
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
    `${STEAM_URLS.CDN}/steam/apps/${appId}/library_600x900_2x.jpg`
  ]
  const fallbackUrl = `${STEAM_URLS.CDN}/steam/apps/${appId}/library_600x900.jpg`

  // Try all candidate URLs and return the first one that exists
  for (const url of candidateUrl) {
    if (await checkImageExists(url)) {
      return url
    }
  }

  // If no candidate URLs exist, return fallback URL
  // TODO: Some newer games use URLs containing a {hash} segment instead of the standard pattern
  return fallbackUrl
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
    `${STEAM_URLS.CDN}/steam/apps/${appId}/logo_2x.png`
  ]
  const fallbackUrl = `${STEAM_URLS.CDN}/steam/apps/${appId}/logo.png`

  // Try all candidate URLs and return the first one that exists
  for (const url of candidateUrl) {
    if (await checkImageExists(url)) {
      return url
    }
  }
  return fallbackUrl
}

export async function checkSteamGameExists(appId: string): Promise<boolean> {
  try {
    const url = `${STEAM_URLS.STORE}/api/appdetails?appids=${appId}`
    const data = (await fetchSteamAPI(url)) as SteamAppDetailsResponse
    return data[appId]?.success || false
  } catch (error) {
    console.error(`Error checking game existence for ID ${appId}:`, error)
    throw error
  }
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  try {
    const games = await searchSteamGames(gameName)
    if (games.length === 0) return ''
    return getGameCover(games[0].id)
  } catch (error) {
    console.error(`Error fetching cover for game ${gameName}:`, error)
    return ''
  }
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  try {
    const games = await searchSteamGames(gameName)
    if (games.length === 0) return []
    return getGameBackgrounds(games[0].id)
  } catch (error) {
    console.error(`Error fetching screenshots for game ${gameName}:`, error)
    return []
  }
}

export async function getGameLogoByName(gameName: string): Promise<string> {
  try {
    const games = await searchSteamGames(gameName)
    if (games.length === 0) return ''
    return getGameLogo(games[0].id)
  } catch (error) {
    console.error(`Error fetching logo for game ${gameName}:`, error)
    return ''
  }
}

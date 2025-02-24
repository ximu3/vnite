import { GameList, GameMetadata } from '@appTypes/utils'
import { SteamAppDetailsResponse, SteamStoreSearchResponse } from './types'
import { formatDate } from '~/utils'
import { getGameHerosFromSteamGridDB } from '../steamGridDb'
import * as cheerio from 'cheerio'

// Defining Base URL Constants
const STEAM_URLS = {
  PRIMARY: {
    STORE: 'https://store.steampowered.com',
    CDN: 'https://steamcdn-a.akamaihd.net',
    COMMUNITY: 'https://steamcommunity.com',
    CLOUDFLARE: 'https://cdn.cloudflare.steamstatic.com'
  },
  FALLBACK: {
    BASE: 'https://api.ximu.dev',
    STORE: 'https://api.ximu.dev/steam/storesearch',
    APP_DETAILS: 'https://api.ximu.dev/steam/appdetails',
    CDN: 'https://api.ximu.dev/steam/cdn',
    COMMUNITY: 'https://api.ximu.dev/steam/community',
    APP: 'https://api.ximu.dev/steam/app'
  }
}

// Generic fetch function with retry logic
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
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

async function fetchWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  try {
    const primaryResponse = await fetchWithTimeout(primaryUrl, options, timeout)
    if (primaryResponse.ok) {
      return primaryResponse
    }
    throw new Error(`Primary request failed with status: ${primaryResponse.status}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('abort')) {
      console.warn(`Primary request timeout (${timeout}ms) for URL: ${primaryUrl}`)
    } else {
      console.warn(`Primary request failed, trying fallback: ${error}`)
    }

    try {
      const fallbackResponse = await fetchWithTimeout(fallbackUrl, options, timeout)
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback request failed with status: ${fallbackResponse.status}`)
      }
      return fallbackResponse
    } catch (fallbackError) {
      const fallbackErrorMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      if (fallbackErrorMessage.includes('abort')) {
        throw new Error(`Both primary and fallback requests timed out after ${timeout}ms`)
      }
      throw fallbackError
    }
  }
}

async function fetchSteamAPI(primaryUrl: string, fallbackUrl: string): Promise<any> {
  const response = await fetchWithFallback(primaryUrl, fallbackUrl)
  return response.json()
}

export async function searchSteamGames(gameName: string): Promise<GameList> {
  try {
    const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/api/storesearch/?term=${encodeURIComponent(
      gameName
    )}&l=schinese&cc=CN`
    const fallbackUrl = `${STEAM_URLS.FALLBACK.STORE}/?term=${encodeURIComponent(
      gameName
    )}&l=schinese&cc=CN`

    const response = (await fetchSteamAPI(primaryUrl, fallbackUrl)) as SteamStoreSearchResponse

    if (!response.items || response.items.length === 0) {
      throw new Error('No games found')
    }

    const gamesMetadata = await Promise.all(
      response.items.map((game) =>
        getSteamMetadata(game.id.toString()).catch((error) => {
          console.error(`Error fetching metadata for game ${game.id}:`, error)
          return {
            releaseDate: '',
            developers: []
          }
        })
      )
    )

    return response.items.map((game, index) => ({
      id: game.id.toString(),
      name: game.name,
      releaseDate: gamesMetadata[index].releaseDate,
      developers: gamesMetadata[index].developers
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
    const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/app/${appId}`
    const fallbackUrl = `${STEAM_URLS.FALLBACK.APP}/${appId}`

    const response = await fetchWithFallback(primaryUrl, fallbackUrl, {
      headers: {
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    })

    const html = await response.text()
    const $ = cheerio.load(html)

    const tags: string[] = []
    $('.app_tag').each((_, element) => {
      const tag = $(element).text().trim()
      if (tag) {
        tags.push(tag)
      }
    })

    return tags.filter((tag) => tag !== '+')
  } catch (error) {
    console.error('Error fetching store tags:', error)
    return []
  }
}

export async function getSteamMetadata(appId: string): Promise<GameMetadata> {
  try {
    const primaryUrlCN = `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}&l=schinese`
    const primaryUrlEN = `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}`
    const fallbackUrlCN = `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}&l=schinese`
    const fallbackUrlEN = `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}`

    const [chineseData, englishData] = (await Promise.all([
      fetchSteamAPI(primaryUrlCN, fallbackUrlCN),
      fetchSteamAPI(primaryUrlEN, fallbackUrlEN)
    ])) as [SteamAppDetailsResponse, SteamAppDetailsResponse]

    if (!chineseData[appId].success) {
      throw new Error(`No game found with ID: ${appId}`)
    }

    const gameDataCN = chineseData[appId].data
    const gameDataEN = englishData[appId].data
    const tags = await fetchStoreTags(appId)

    return {
      name: gameDataCN.name,
      originalName: gameDataEN.name,
      releaseDate: formatDate(gameDataEN.release_date.date),
      description:
        gameDataCN.detailed_description ||
        gameDataCN.about_the_game ||
        gameDataCN.short_description,
      developers: gameDataCN.developers,
      publishers: gameDataCN.publishers,
      genres: gameDataCN.genres?.map((genre) => genre.description) || [],
      relatedSites: [
        ...(gameDataCN.website ? [{ label: '官方网站', url: gameDataCN.website }] : []),
        ...(gameDataCN.metacritic?.url
          ? [{ label: 'Metacritic', url: gameDataCN.metacritic.url }]
          : []),
        { label: 'Steam', url: `${STEAM_URLS.PRIMARY.STORE}/app/${appId}` }
      ],
      tags: tags.length > 0 ? tags : gameDataCN.genres?.map((genre) => genre.description) || []
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${appId}:`, error)
    throw error
  }
}

export async function getGameScreenshots(appId: string): Promise<string[]> {
  // try {
  //   const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}`
  //   const fallbackUrl = `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}`
  //   const data = (await fetchSteamAPI(primaryUrl, fallbackUrl)) as SteamAppDetailsResponse
  //   if (!data[appId].success) {
  //     return []
  //   }
  //   return data[appId].data.screenshots.map((screenshot) => screenshot.path_full)
  // } catch (error) {
  //   console.error(`Error fetching screenshots for game ${appId}:`, error)
  //   return []
  // }
  return await getGameHerosFromSteamGridDB(Number(appId))
}

async function checkImageUrl(url: string, timeout = 5000): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, timeout)
    return response.ok
  } catch (_error) {
    return false
  }
}

export async function getGameCover(appId: string): Promise<string> {
  const urls = {
    primary: {
      hd: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/library_600x900_2x.jpg`,
      standard: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/library_600x900.jpg`
    },
    fallback: {
      hd: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/library_600x900_2x.jpg`,
      standard: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/library_600x900.jpg`
    }
  }

  try {
    const urlsToCheck = [
      urls.primary.hd,
      urls.primary.standard,
      urls.fallback.hd,
      urls.fallback.standard
    ]

    for (const url of urlsToCheck) {
      if (await checkImageUrl(url)) {
        return url
      }
    }

    return ''
  } catch (error) {
    console.error(`Error fetching cover for game ${appId}:`, error)
    return ''
  }
}

type IconSize = 'small' | 'medium' | 'large'

export async function getGameIcon(appId: string, size: IconSize = 'small'): Promise<string> {
  const urls = {
    primary: {
      small: `${STEAM_URLS.PRIMARY.CLOUDFLARE}/steamcommunity/public/images/apps/${appId}/icon.jpg`,
      medium: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/capsule_231x87.jpg`,
      large: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/header.jpg`
    },
    fallback: {
      small: `${STEAM_URLS.FALLBACK.COMMUNITY}/public/images/apps/${appId}/icon.jpg`,
      medium: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/capsule_231x87.jpg`,
      large: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/header.jpg`
    }
  }

  try {
    if (await checkImageUrl(urls.primary[size])) {
      return urls.primary[size]
    }

    if (await checkImageUrl(urls.fallback[size])) {
      return urls.fallback[size]
    }

    if (size !== 'small') {
      if (await checkImageUrl(urls.primary.small)) {
        return urls.primary.small
      }
      if (await checkImageUrl(urls.fallback.small)) {
        return urls.fallback.small
      }
    }

    return ''
  } catch (error) {
    console.error(`Error fetching icon for game ${appId}:`, error)
    return ''
  }
}

export async function checkSteamGameExists(appId: string): Promise<boolean> {
  try {
    const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}`
    const fallbackUrl = `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}`

    const data = (await fetchSteamAPI(primaryUrl, fallbackUrl)) as SteamAppDetailsResponse
    return data[appId]?.success || false
  } catch (error) {
    console.error(`Error checking game existence for ID ${appId}:`, error)
    throw error
  }
}

export async function getGameCoverByTitle(gameName: string): Promise<string> {
  try {
    const games = await searchSteamGames(gameName)
    return await getGameCover(games[0].id)
  } catch (error) {
    console.error(`Error fetching cover for game ${gameName}:`, error)
    return ''
  }
}

export async function getGameScreenshotsByTitle(gameName: string): Promise<string[]> {
  try {
    const games = await searchSteamGames(gameName)
    return await getGameScreenshots(games[0].id)
  } catch (error) {
    console.error(`Error fetching screenshots for game ${gameName}:`, error)
    return []
  }
}

import { GameList, GameMetadata } from '../types'
import { SteamAppDetailsResponse, SteamStoreSearchResponse } from './types'
import { formatDate } from '~/utils'
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
async function fetchWithFallback(
  primaryUrl: string,
  fallbackUrl: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const primaryResponse = await fetch(primaryUrl, options)
    if (primaryResponse.ok) {
      return primaryResponse
    }
    throw new Error(`Primary request failed with status: ${primaryResponse.status}`)
  } catch (error) {
    console.warn(`Primary request failed, trying fallback: ${error}`)
    const fallbackResponse = await fetch(fallbackUrl, options)
    if (!fallbackResponse.ok) {
      throw new Error(`Fallback request failed with status: ${fallbackResponse.status}`)
    }
    return fallbackResponse
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
          : [])
      ],
      tags: tags.length > 0 ? tags : gameDataCN.genres?.map((genre) => genre.description) || []
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${appId}:`, error)
    throw error
  }
}

export async function getGameScreenshots(appId: string): Promise<string[]> {
  try {
    const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}`
    const fallbackUrl = `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}`

    const data = (await fetchSteamAPI(primaryUrl, fallbackUrl)) as SteamAppDetailsResponse

    if (!data[appId].success) {
      return []
    }

    return data[appId].data.screenshots.map((screenshot) => screenshot.path_full)
  } catch (error) {
    console.error(`Error fetching screenshots for game ${appId}:`, error)
    return []
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
    // Try the major HD versions
    const hdResponse = await fetch(urls.primary.hd, { method: 'HEAD' })
    if (hdResponse.ok) return urls.primary.hd

    // Try the major standards version
    const standardResponse = await fetch(urls.primary.standard, { method: 'HEAD' })
    if (standardResponse.ok) return urls.primary.standard

    // Try the alternate HD version
    const fallbackHdResponse = await fetch(urls.fallback.hd, { method: 'HEAD' })
    if (fallbackHdResponse.ok) return urls.fallback.hd

    // Try the alternate standard version
    const fallbackStandardResponse = await fetch(urls.fallback.standard, { method: 'HEAD' })
    if (fallbackStandardResponse.ok) return urls.fallback.standard

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
    // Try the main URL
    const primaryResponse = await fetch(urls.primary[size], { method: 'HEAD' })
    if (primaryResponse.ok) return urls.primary[size]

    // Try alternate URLs
    const fallbackResponse = await fetch(urls.fallback[size], { method: 'HEAD' })
    if (fallbackResponse.ok) return urls.fallback[size]

    // If the requested size is not small, try to downgrade to small size
    if (size !== 'small') {
      const smallResponse = await fetch(urls.primary.small, { method: 'HEAD' })
      if (smallResponse.ok) return urls.primary.small

      const fallbackSmallResponse = await fetch(urls.fallback.small, { method: 'HEAD' })
      if (fallbackSmallResponse.ok) return urls.fallback.small
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

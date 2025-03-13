import { GameList, GameMetadata } from '@appTypes/utils'
import { SteamAppDetailsResponse, SteamStoreSearchResponse } from './types'
import { formatDate } from '~/utils'
import * as cheerio from 'cheerio'
import { getSteamLanguageConfig, getTranslation } from './i18n'

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
    const langConfig = await getSteamLanguageConfig()

    const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/api/storesearch/?term=${encodeURIComponent(
      gameName
    )}&l=${langConfig.apiLanguageCode}&cc=${langConfig.countryCode}`

    const fallbackUrl = `${STEAM_URLS.FALLBACK.STORE}/?term=${encodeURIComponent(
      gameName
    )}&l=${langConfig.apiLanguageCode}&cc=${langConfig.countryCode}`

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
    const langConfig = await getSteamLanguageConfig()

    const primaryUrl = `${STEAM_URLS.PRIMARY.STORE}/app/${appId}`
    const fallbackUrl = `${STEAM_URLS.FALLBACK.APP}/${appId}`

    const response = await fetchWithFallback(primaryUrl, fallbackUrl, {
      headers: {
        'Accept-Language': langConfig.acceptLanguageHeader
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
    const langConfig = await getSteamLanguageConfig()

    // 获取当前语言的数据
    const primaryUrlLocal = `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}&l=${langConfig.apiLanguageCode}`
    const fallbackUrlLocal = `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}&l=${langConfig.apiLanguageCode}`

    // 获取英语数据作为原始名称（如果当前语言不是英语）
    const needsOriginalName = langConfig.apiLanguageCode !== 'english'

    let localData: SteamAppDetailsResponse
    let englishData: SteamAppDetailsResponse | null = null

    if (needsOriginalName) {
      // 并行获取本地语言和英语数据
      ;[localData, englishData] = await Promise.all([
        fetchSteamAPI(primaryUrlLocal, fallbackUrlLocal),
        fetchSteamAPI(
          `${STEAM_URLS.PRIMARY.STORE}/api/appdetails?appids=${appId}&l=english`,
          `${STEAM_URLS.FALLBACK.APP_DETAILS}?appids=${appId}&l=english`
        )
      ])
    } else {
      // 仅获取一种语言
      localData = await fetchSteamAPI(primaryUrlLocal, fallbackUrlLocal)
      englishData = localData // 如果当前语言就是英语，则复用
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
      releaseDate: formatDate(gameData.release_date.date),
      description:
        gameData.detailed_description || gameData.about_the_game || gameData.short_description,
      developers: gameData.developers,
      publishers: gameData.publishers,
      genres: gameData.genres?.map((genre) => genre.description) || [],
      relatedSites: [
        ...(gameData.website
          ? [{ label: await getTranslation('officialWebsite'), url: gameData.website }]
          : []),
        ...(gameData.metacritic?.url
          ? [{ label: 'Metacritic', url: gameData.metacritic.url }]
          : []),
        {
          label: await getTranslation('steamStore'),
          url: `${STEAM_URLS.PRIMARY.STORE}/app/${appId}`
        }
      ],
      tags: tags.length > 0 ? tags : gameData.genres?.map((genre) => genre.description) || []
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${appId}:`, error)
    throw error
  }
}

export async function getSteamMetadataByName(gameName: string): Promise<GameMetadata> {
  try {
    const games = await searchSteamGames(gameName)
    return await getSteamMetadata(games[0].id)
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameName}:`, error)
    throw error
  }
}

export async function getGameBackground(appId: string): Promise<string> {
  const urls = {
    primary: {
      hd: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/library_hero_2x.jpg`,
      standard: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/library_hero.jpg`
    },
    fallback: {
      hd: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/library_hero_2x.jpg`,
      standard: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/library_hero.jpg`
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
    console.error('获取游戏Background图片失败:', error)
    return ''
  }
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

export async function getGameLogo(appId: string): Promise<string> {
  const urls = {
    primary: {
      hd: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/logo_2x.png`,
      standard: `${STEAM_URLS.PRIMARY.CDN}/steam/apps/${appId}/logo.png`
    },
    fallback: {
      hd: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/logo_2x.png`,
      standard: `${STEAM_URLS.FALLBACK.CDN}/steam/apps/${appId}/logo.png`
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
    console.error(`Error fetching logo for game ${appId}:`, error)
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

export async function getGameCoverByName(gameName: string): Promise<string> {
  try {
    const games = await searchSteamGames(gameName)
    return await getGameCover(games[0].id)
  } catch (error) {
    console.error(`Error fetching cover for game ${gameName}:`, error)
    return ''
  }
}

export async function getGameBackgroundByName(gameName: string): Promise<string> {
  try {
    const games = await searchSteamGames(gameName)
    return await getGameBackground(games[0].id)
  } catch (error) {
    console.error(`Error fetching screenshots for game ${gameName}:`, error)
    return ''
  }
}

// export async function getGameIconByName(gameName: string): Promise<string> {
//   try {
//     const games = await searchSteamGames(gameName)
//     return await getGameIcon(games[0].id)
//   } catch (error) {
//     console.error(`Error fetching icon for game ${gameName}:`, error)
//     return ''
//   }
// }

export async function getGameLogoByName(gameName: string): Promise<string> {
  try {
    const games = await searchSteamGames(gameName)
    return await getGameLogo(games[0].id)
  } catch (error) {
    console.error(`Error fetching logo for game ${gameName}:`, error)
    return ''
  }
}

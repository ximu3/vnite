import { GameList, GameMetadata } from '../types'
import { SteamAppDetailsResponse, SteamStoreSearchResponse } from './types'
import { formatDate } from '~/utils'
import * as cheerio from 'cheerio'

async function fetchSteamAPI(url: string): Promise<any> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function searchSteamGames(gameName: string): Promise<GameList> {
  try {
    // Using the Steam Store API Search Interface
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=schinese&cc=CN`
    const response = (await fetchSteamAPI(searchUrl)) as SteamStoreSearchResponse

    if (!response.items || response.items.length === 0) {
      throw new Error('No games found')
    }

    // Get metadata for all games
    const gamesMetadata = await Promise.all(
      response.items.map((game) =>
        getSteamMetadata(game.id.toString()).catch((error) => {
          console.error(`Error fetching metadata for game ${game.id}:`, error)
          // If getting metadata fails, return an object with default values
          return {
            releaseDate: '',
            developers: []
          }
        })
      )
    )

    // Combine search results with corresponding metadata
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
    } else {
      console.log('An unknown error occurred')
      throw new Error('An unknown error occurred')
    }
  }
}

async function fetchStoreTags(appId: string): Promise<string[]> {
  try {
    // Get store page HTML
    const response = await fetch(`https://store.steampowered.com/app/${appId}`, {
      headers: {
        'Accept-Language': 'zh-CN,zh;q=0.9' // Request Chinese Page
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // Extracting labeled data
    // Tags on Steam store pages are usually found in elements with the "app_tag" class
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
    return [] // Returns an empty array if fetching fails
  }
}

export async function getSteamMetadata(appId: string): Promise<GameMetadata> {
  try {
    // Simultaneous request for Chinese and English data
    const [chineseData, englishData] = (await Promise.all([
      fetchSteamAPI(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=schinese`),
      fetchSteamAPI(`https://store.steampowered.com/api/appdetails?appids=${appId}`)
    ])) as [SteamAppDetailsResponse, SteamAppDetailsResponse]

    if (!chineseData[appId].success) {
      throw new Error(`No game found with ID: ${appId}`)
    }

    const gameDataCN = chineseData[appId].data
    const gameDataEN = englishData[appId].data

    const tags =
      (await fetchStoreTags(appId)) ||
      (gameDataCN.genres && gameDataCN.genres.length !== 0
        ? gameDataCN.genres.map((genre) => genre.description)
        : [])

    return {
      name: gameDataCN.name,
      originalName: gameDataEN.name, // Use of English data as the original name
      releaseDate: formatDate(gameDataEN.release_date.date),
      description:
        gameDataCN.detailed_description ||
        gameDataCN.about_the_game ||
        gameDataCN.short_description,
      developers: gameDataCN.developers,
      publishers: gameDataCN.publishers, // Add Publisher
      genres:
        gameDataCN.genres && gameDataCN.genres.length !== 0
          ? gameDataCN.genres.map((genre) => genre.description)
          : [], // Game Type
      relatedSites: [
        ...(gameDataCN.website ? [{ label: '官方网站', url: gameDataCN.website }] : []),
        ...(gameDataCN.metacritic?.url
          ? [{ label: 'Metacritic', url: gameDataCN.metacritic.url }]
          : [])
      ],
      tags
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${appId}:`, error)
    throw error
  }
}

export async function checkSteamGameExists(appId: string): Promise<boolean> {
  try {
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`
    const data = (await fetchSteamAPI(detailsUrl)) as SteamAppDetailsResponse

    return data[appId]?.success || false
  } catch (error) {
    console.error(`Error checking game existence for ID ${appId}:`, error)
    return false
  }
}

export async function getGameScreenshots(appId: string): Promise<string[]> {
  try {
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`
    const data = (await fetchSteamAPI(detailsUrl)) as SteamAppDetailsResponse

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
  try {
    const coverUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900_2x.jpg`

    // Check if the image exists
    const response = await fetch(coverUrl, { method: 'HEAD' })
    if (!response.ok) {
      // If the HD version is not available, try using the standard version
      const standardUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`
      const standardResponse = await fetch(standardUrl, { method: 'HEAD' })

      return standardResponse.ok ? standardUrl : ''
    }

    return coverUrl
  } catch (error) {
    console.error(`Error fetching cover for game ${appId}:`, error)
    return ''
  }
}

export type IconSize = 'small' | 'medium' | 'large'

export async function getGameIcon(appId: string, size: IconSize = 'small'): Promise<string> {
  try {
    // Icon URLs in different sizes
    const iconUrls = {
      // Small icons with 32x32 pixels
      small: `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/icon.jpg`,
      // Medium icon with 184x69 pixels
      medium: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`,
      // Large icons/banners with 460x215 pixels
      large: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
    }

    const iconUrl = iconUrls[size]

    // Check if the icon exists
    const response = await fetch(iconUrl, { method: 'HEAD' })

    if (!response.ok) {
      // If the requested size is not available, try to fall back to the small icon
      if (size !== 'small') {
        const fallbackResponse = await fetch(iconUrls.small, { method: 'HEAD' })
        return fallbackResponse.ok ? iconUrls.small : ''
      }
      return ''
    }

    return iconUrl
  } catch (error) {
    console.error(`Error fetching icon for game ${appId}:`, error)
    return ''
  }
}

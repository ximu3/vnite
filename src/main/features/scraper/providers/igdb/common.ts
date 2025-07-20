import { GameList, GameMetadata } from '@appTypes/utils'
import {
  IGDBGameResponse,
  IGDBSearchResponse,
  IGDBWebsiteCategory,
  IGDBScreenshotResponse,
  IGDBCoverResponse,
  IGDBAuthConfig
} from './types'
import { formatDate } from '~/utils'
import { IGDBClient } from './auth'

// Create a client instance (no global state)
function createIGDBClient(): IGDBClient {
  const config: IGDBAuthConfig = {
    clientId: import.meta.env.VITE_IGDB_API_ID || '',
    clientSecret: import.meta.env.VITE_IGDB_API_KEY || ''
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('IGDB API credentials not configured')
  }

  return new IGDBClient(config)
}

export async function searchIGDBGames(gameName: string): Promise<GameList> {
  try {
    const query = `
      search "${gameName}";
      fields name,first_release_date,involved_companies.company.name,involved_companies.developer;
      limit 10;
    `
    const client = createIGDBClient()
    const response = await client.request<IGDBSearchResponse>('games', query)

    if (!Array.isArray(response)) {
      return []
    }

    return response.map((game) => ({
      id: game.id.toString(),
      name: game.name,
      releaseDate: game.first_release_date
        ? formatDate(new Date(game.first_release_date * 1000).toISOString())
        : '',
      developers:
        game.involved_companies
          ?.filter((company) => company.developer)
          .map((company) => company.company.name) || []
    }))
  } catch (error) {
    console.error('Error fetching IGDB games:', error)
    throw error
  }
}

export async function getIGDBMetadata(gameId: string): Promise<GameMetadata> {
  try {
    const query = `
      fields name,summary,first_release_date,
      involved_companies.company.name,involved_companies.developer,involved_companies.publisher,
      genres.name,
      websites.*,
      themes.name;
      where id = ${gameId};
    `
    const client = createIGDBClient()
    const response = await client.request<IGDBGameResponse>('games', query)

    if (!Array.isArray(response) || response.length === 0) {
      throw new Error(`No game found with ID: ${gameId}`)
    }

    const gameData = response[0]

    const relatedSites =
      gameData.websites?.map((site) => ({
        label: IGDBWebsiteCategory[site.category] || 'Other',
        url: site.url
      })) || []

    return {
      name: gameData.name,
      originalName: gameData.name,
      releaseDate: gameData.first_release_date
        ? formatDate(new Date(gameData.first_release_date * 1000).toISOString())
        : '',
      description: gameData.summary || '',
      developers:
        gameData.involved_companies
          ?.filter((company) => company.developer)
          .map((company) => company.company.name) || [],
      publishers:
        gameData.involved_companies
          ?.filter((company) => company.publisher)
          .map((company) => company.company.name) || [],
      genres: gameData.genres?.map((genre) => genre.name) || [],
      relatedSites,
      tags: gameData.themes?.map((theme) => theme.name) || []
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameId}:`, error)
    throw error
  }
}

export async function getIGDBMetadataByName(gameName: string): Promise<GameMetadata> {
  try {
    const games = await searchIGDBGames(gameName)
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
    return await getIGDBMetadata(games[0].id)
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameName}:`, error)
    throw error
  }
}

export async function getGameBackgrounds(gameId: string): Promise<string[]> {
  try {
    const query = `
      fields url,image_id;
      where game = ${gameId};
    `
    const client = createIGDBClient()
    const response = await client.request<IGDBScreenshotResponse>('screenshots', query)

    if (!Array.isArray(response)) {
      return []
    }

    return response.map(
      (screenshot) =>
        `https://images.igdb.com/igdb/image/upload/t_screenshot_huge/${screenshot.image_id}.jpg`
    )
  } catch (error) {
    console.error(`Error fetching screenshots for game ${gameId}:`, error)
    return []
  }
}

export async function checkIGDBGameExists(gameId: string): Promise<boolean> {
  try {
    const query = `
      fields id;
      where id = ${gameId};
    `
    const client = createIGDBClient()
    const response = await client.request<IGDBGameResponse>('games', query)

    return Array.isArray(response) && response.length > 0
  } catch (error) {
    console.error(`Error checking if game exists:`, error)
    return false
  }
}

export async function getGameCover(gameId: string): Promise<string> {
  try {
    const query = `
      fields url,image_id;
      where game = ${gameId};
    `
    const client = createIGDBClient()
    const response = await client.request<IGDBCoverResponse>('covers', query)

    if (!Array.isArray(response) || response.length === 0) {
      return ''
    }

    const cover = response[0]
    return `https://images.igdb.com/igdb/image/upload/t_cover_big/${cover.image_id}.jpg`
  } catch (error) {
    console.error(`Error fetching cover for game ${gameId}:`, error)
    return ''
  }
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  try {
    const games = await searchIGDBGames(gameName)
    if (games.length === 0) {
      return ''
    }
    return await getGameCover(games[0].id)
  } catch (error) {
    console.error(`Error fetching cover for game ${gameName}:`, error)
    return ''
  }
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  try {
    const games = await searchIGDBGames(gameName)
    if (games.length === 0) {
      return []
    }
    return await getGameBackgrounds(games[0].id)
  } catch (error) {
    console.error(`Error fetching screenshots for game ${gameName}:`, error)
    return []
  }
}

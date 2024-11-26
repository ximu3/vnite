// common.ts
import { GameList, GameMetadata } from '../types'
import {
  IGDBGameResponse,
  IGDBSearchResponse,
  IGDBWebsiteCategory,
  IGDBScreenshotResponse,
  IGDBCoverResponse
} from './types'
import { formatDate } from '~/utils'
import { getIGDBClient, initIGDBClient } from './client'

// 初始化客户端（在应用启动时调用）
export function initIGDB(): void {
  initIGDBClient({
    clientId: '6b8jg4hj77ob126dw3w6noih0vz6b5',
    clientSecret: '6xlsuzodsrsxy7x1cd4fpmhny0cnbu'
  })
}

// 搜索游戏函数
export async function searchIGDBGames(gameName: string): Promise<GameList> {
  try {
    const query = `
      search "${gameName}";
      fields name,first_release_date,involved_companies.company.name,involved_companies.developer;
      limit 10;
    `
    const client = getIGDBClient()
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

// 获取游戏元数据函数
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
    const client = getIGDBClient()
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

// 获取游戏截图
export async function getGameScreenshots(gameId: string): Promise<string[]> {
  try {
    const query = `
      fields url,image_id;
      where game = ${gameId};
    `
    const client = getIGDBClient()
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
    const client = getIGDBClient()
    const response = await client.request<IGDBGameResponse>('games', query)

    return Array.isArray(response) && response.length > 0
  } catch (error) {
    console.error(`Error checking if game exists:`, error)
    return false
  }
}

// 获取游戏封面
export async function getGameCover(gameId: string): Promise<string> {
  try {
    const query = `
      fields url,image_id;
      where game = ${gameId};
    `
    const client = getIGDBClient()
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

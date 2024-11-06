import { GameList, GameMetadata } from '../types'
import { BangumiSearchResult, BangumiSubject } from './types'

async function fetchBangumi<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(`https://api.bangumi.tv/v0/${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'YourAppName/1.0' // 建议设置 User-Agent
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// 搜索游戏函数
export async function searchBangumiGames(gameName: string): Promise<GameList> {
  try {
    const data = await fetchBangumi<BangumiSearchResult>('search/subject', {
      type: 4,
      keyword: gameName
    })

    return data.list.map((game) => ({
      id: game.id.toString(),
      name: game.name,
      releaseDate: game.air_date || '',
      developers: game.staff?.filter((s) => s.role === 'developer').map((s) => s.name) || []
    }))
  } catch (error) {
    console.error('Error fetching Bangumi ', error)
    throw error
  }
}

// 获取游戏元数据函数
export async function getBangumiMetadata(gameId: string): Promise<GameMetadata> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`subjects/${gameId}`)

    return {
      name: game.name,
      originalName: game.name_cn || game.name,
      releaseDate: game.air_date || '',
      description: game.summary || '',
      developers: game.staff?.filter((s) => s.role === 'developer').map((s) => s.name) || [],
      relatedSites: [{ label: 'Bangumi', url: game.url }],
      tags: game.tags?.map((tag) => tag.name) || []
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameId}:`, error)
    throw error
  }
}

// 检查游戏是否存在
export async function checkGameExists(gameId: string): Promise<boolean> {
  try {
    await fetchBangumi<BangumiSubject>(`subjects/${gameId}`)
    return true
  } catch (error) {
    console.error(`Error checking game existence for ID ${gameId}:`, error)
    return false
  }
}

// 获取游戏截图
export async function getGameScreenshots(gameId: string): Promise<string[]> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`subjects/${gameId}`)
    // 注意：这里需要根据实际 API 返回的数据结构调整
    // 当前 Bangumi API 可能并不直接提供截图列表
    return [game.images.large]
  } catch (error) {
    console.error(`Error fetching images for game ${gameId}:`, error)
    return []
  }
}

// 获取游戏封面
export async function getGameCover(gameId: string): Promise<string> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`subjects/${gameId}`)
    return game.images.large || ''
  } catch (error) {
    console.error(`Error fetching cover for game ${gameId}:`, error)
    return ''
  }
}

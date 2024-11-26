import { GameList, GameMetadata } from '../types'
import { BangumiSearchResult, BangumiSubject } from './types'
import { getGameScreenshotsByTitleFromVNDB } from '../vndb'

async function fetchBangumi<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(`https://api.bgm.tv/${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ximu3/vnite/2.0.0-alpha.0 (https://github.com/ximu3/vnite)',
      Authorization: 'Bearer l3AoRehijcoerQ4GFheGV6LPmJQhvi1T2ONWEDZd'
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
    // 对游戏名进行 URL 编码
    const encodedGameName = encodeURIComponent(gameName)

    // 使用正确的 URL 格式
    const data = await fetchBangumi<BangumiSearchResult>(`search/subject/${encodedGameName}`, {
      type: 4,
      max_results: 25
    })

    return data.list.map((game) => ({
      id: game.id.toString(),
      name: game?.name_cn || game.name,
      releaseDate: game.air_date || '',
      developers: game.staff?.filter((s) => s.role === 'developer').map((s) => s.name) || []
    }))
  } catch (error) {
    console.error('Error fetching Bangumi:', error)
    throw error
  }
}

const DEVELOPER_FIELDS = ['开发', '游戏开发商', '开发商', 'Developer', 'Developers']

// 辅助函数：从 infoBox 中获取开发商信息
function getDevelopers(infobox: { key: string; value: string }[] | undefined): string[] {
  if (!infobox) return []

  // 遍历所有可能的字段名，返回第一个存在的值
  for (const field of DEVELOPER_FIELDS) {
    const developerEntry = infobox.find((entry) => entry.key === field)
    if (developerEntry) {
      // 将字符串值转换为数组
      return developerEntry.value.split('、')
    }
  }

  return []
}

const PUBLISHER_FIELDS = ['发行', '发行商', 'Publisher', 'Publishers']

// 辅助函数：从 infoBox 中获取发行商信息
function getPublishers(infobox: { key: string; value: string }[] | undefined): string[] {
  if (!infobox) return []

  // 遍历所有可能的字段名，返回第一个存在的值
  for (const field of PUBLISHER_FIELDS) {
    const publisherEntry = infobox.find((entry) => entry.key === field)
    if (publisherEntry) {
      // 将字符串值转换为数组
      return publisherEntry.value.split('、')
    }
  }

  return []
}

// 辅助函数：从 infoBox 中获取网站信息
function getRelatedSites(
  infobox: { key: string; value: string }[] | undefined
): { label: string; url: string }[] {
  if (!infobox) return []

  // 查找 key 为 'websites' 的条目
  const websiteEntry = infobox.find((entry) => entry.key === 'website')
  if (websiteEntry) {
    return [{ label: '官方网站', url: websiteEntry.value }]
  }

  return []
}

const GENRE_FIELDS = ['类型', '游戏类型']

function getGenres(infobox: { key: string; value: string }[] | undefined): string[] {
  if (!infobox) return []

  // 遍历所有可能的字段名，返回第一个存在的值
  for (const field of GENRE_FIELDS) {
    const genreEntry = infobox.find((entry) => entry.key === field)
    if (genreEntry) {
      // 将字符串值转换为数组
      return genreEntry.value.split(' / ')
    }
  }

  return []
}

// 获取游戏元数据函数
export async function getBangumiMetadata(gameId: string): Promise<GameMetadata> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)

    return {
      name: game?.name_cn || game.name,
      originalName: game.name,
      releaseDate: game.date || '',
      description: game.summary || '',
      genres: getGenres(game.infobox),
      publishers: getPublishers(game.infobox),
      developers: getDevelopers(game.infobox),
      relatedSites: getRelatedSites(game.infobox),
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
    await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)
    return true
  } catch (error) {
    console.error(`Error checking game existence for ID ${gameId}:`, error)
    return false
  }
}

// 获取游戏截图
export async function getGameScreenshots(gameId: string): Promise<string[]> {
  try {
    const gameName = (await getBangumiMetadata(gameId)).originalName
    return await getGameScreenshotsByTitleFromVNDB(gameName!)
  } catch (error) {
    console.error(`Error fetching images for game ${gameId}:`, error)
    return []
  }
}

// 获取游戏封面
export async function getGameCover(gameId: string): Promise<string> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)
    return game.images.large || ''
  } catch (error) {
    console.error(`Error fetching cover for game ${gameId}:`, error)
    return ''
  }
}

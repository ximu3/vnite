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

// 搜索游戏函数
export async function searchSteamGames(gameName: string): Promise<GameList> {
  try {
    // 使用 Steam Store API 搜索接口
    const searchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=schinese&cc=CN`
    const response = (await fetchSteamAPI(searchUrl)) as SteamStoreSearchResponse

    if (!response.items || response.items.length === 0) {
      throw new Error('No games found')
    }

    // 获取所有游戏的元数据
    const gamesMetadata = await Promise.all(
      response.items.map((game) =>
        getSteamMetadata(game.id.toString()).catch((error) => {
          console.error(`Error fetching metadata for game ${game.id}:`, error)
          // 如果获取元数据失败，返回一个带有默认值的对象
          return {
            releaseDate: '',
            developers: []
          }
        })
      )
    )

    // 将搜索结果与对应的元数据组合
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
    // 获取商店页面 HTML
    const response = await fetch(`https://store.steampowered.com/app/${appId}`, {
      headers: {
        'Accept-Language': 'zh-CN,zh;q=0.9' // 请求中文页面
      }
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // 提取标签数据
    // Steam 商店页面中的标签通常在带有 "app_tag" 类的元素中
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
    return [] // 如果获取失败，返回空数组
  }
}

// 获取游戏元数据函数
export async function getSteamMetadata(appId: string): Promise<GameMetadata> {
  try {
    // 同时请求中文和英文数据
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
      originalName: gameDataEN.name, // 使用英文数据作为原名
      releaseDate: formatDate(gameDataEN.release_date.date),
      description:
        gameDataCN.detailed_description ||
        gameDataCN.about_the_game ||
        gameDataCN.short_description,
      developers: gameDataCN.developers,
      publishers: gameDataCN.publishers, // 添加发行商
      genres:
        gameDataCN.genres && gameDataCN.genres.length !== 0
          ? gameDataCN.genres.map((genre) => genre.description)
          : [], // 游戏类型
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

// 检查游戏是否存在
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

// 获取游戏截图
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

// 获取游戏封面
export async function getGameCover(appId: string): Promise<string> {
  try {
    const coverUrl = `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900_2x.jpg`

    // 检查图片是否存在
    const response = await fetch(coverUrl, { method: 'HEAD' })
    if (!response.ok) {
      // 如果高清版不存在，尝试使用标准版
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
    // 不同尺寸的图标 URL
    const iconUrls = {
      // 32x32 像素的小图标
      small: `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${appId}/icon.jpg`,
      // 184x69 像素的中等图标
      medium: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/capsule_231x87.jpg`,
      // 460x215 像素的大图标/横幅
      large: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
    }

    const iconUrl = iconUrls[size]

    // 检查图标是否存在
    const response = await fetch(iconUrl, { method: 'HEAD' })

    if (!response.ok) {
      // 如果请求的尺寸不可用，尝试回退到小图标
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

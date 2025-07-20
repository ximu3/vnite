import { net } from 'electron'
import {
  getGameBackground as getGameBackgroundFromSteam,
  getGameBackgroundByName as getGameBackgroundByNameFromSteam,
  getGameCover as getGameCoverFromSteam,
  getGameCoverByName as getGameCoverByNameFromSteam,
  getGameLogo as getGameLogoFromSteam,
  getGameLogoByName as getGameLogoByNameFromSteam
} from '../steam/common'

const STEAMGRIDDB_API_KEY = import.meta.env.VITE_STEAMGRIDDB_API_KEY || ''
const TIMEOUT = 5000

// 定义 API 端点
const API_ENDPOINT = 'https://www.steamgriddb.com/api/v2'

// Timeout-controlled fetch function
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<any> => {
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

async function fetchSteamGridDb(
  endpoint: string,
  queryParams?: Record<string, string>
): Promise<any> {
  const params = new URLSearchParams(queryParams)
  const url = `${API_ENDPOINT}/${endpoint}${queryParams ? `?${params.toString()}` : ''}`

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`
        }
      },
      TIMEOUT
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error(`API request failed:`, error)
    throw error
  }
}

export async function getGameCovers(steamId: string): Promise<string[]> {
  try {
    const idData = (await fetchSteamGridDb(`games/steam/${steamId}`)) as {
      data: { id: number }
    }
    const gameId = idData?.data?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${steamId}`)
      return []
    }

    const data = await fetchSteamGridDb(`grids/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((grid: any) => grid.url) || []

    // 将游戏封面插入数组顶部
    const coverUrl = await getGameCoverFromSteam(steamId)
    if (coverUrl) {
      urls.unshift(coverUrl)
    }
    return urls
  } catch (error) {
    console.error(`Error getting SteamGridDB cover:`, error)
    return []
  }
}

export async function getGameCoversByName(gameName: string): Promise<string[]> {
  try {
    const searchData = (await fetchSteamGridDb(
      `search/autocomplete/${encodeURIComponent(gameName)}`
    )) as { data: { id: number }[] }
    const gameId = searchData?.data?.[0]?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${gameName}`)
      return []
    }

    const data = await fetchSteamGridDb(`grids/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((grid: any) => grid.url) || []

    // 将游戏封面插入数组顶部
    const coverUrl = await getGameCoverByNameFromSteam(gameName)
    if (coverUrl) {
      urls.unshift(coverUrl)
    }
    return urls
  } catch (error) {
    console.error(`Error getting SteamGridDB cover:`, error)
    return []
  }
}

export async function getGameBackgrounds(steamId: string): Promise<string[]> {
  try {
    const idData = (await fetchSteamGridDb(`games/steam/${steamId}`)) as {
      data: { id: number }
    }
    const gameId = idData?.data?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${steamId}`)
      return []
    }

    const data = await fetchSteamGridDb(`heroes/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((hero: any) => hero.url) || []

    // 将游戏背景图插入数组顶部
    const heroUrl = await getGameBackgroundFromSteam(steamId)
    if (heroUrl) {
      urls.unshift(heroUrl)
    }
    return urls
  } catch (error) {
    console.error(`Error Getting SteamGridDB Background:`, error)
    return []
  }
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  try {
    const searchData = (await fetchSteamGridDb(
      `search/autocomplete/${encodeURIComponent(gameName)}`
    )) as { data: { id: number }[] }
    const gameId = searchData?.data?.[0]?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${gameName}`)
      return []
    }

    const data = await fetchSteamGridDb(`heroes/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((hero: any) => hero.url) || []

    // 将游戏背景图插入数组顶部
    const heroUrl = await getGameBackgroundByNameFromSteam(gameName)
    if (heroUrl) {
      urls.unshift(heroUrl)
    }
    return urls
  } catch (error) {
    console.error(`Error Getting SteamGridDB Background:`, error)
    return []
  }
}

export async function getGameLogos(steamId: string): Promise<string[]> {
  try {
    const idData = (await fetchSteamGridDb(`games/steam/${steamId}`)) as {
      data: { id: number }
    }
    const gameId = idData?.data?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${steamId}`)
      return []
    }

    const data = await fetchSteamGridDb(`logos/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((logo: any) => logo.url) || []

    // 将游戏 logo 插入数组顶部
    const logoUrl = await getGameLogoFromSteam(steamId)
    if (logoUrl) {
      urls.unshift(logoUrl)
    }
    return urls
  } catch (error) {
    console.error(`Error Getting SteamGridDB Logo:`, error)
    return []
  }
}

export async function getGameLogosByName(gameName: string): Promise<string[]> {
  try {
    const searchData = (await fetchSteamGridDb(
      `search/autocomplete/${encodeURIComponent(gameName)}`
    )) as { data: { id: number }[] }
    const gameId = searchData?.data?.[0]?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${gameName}`)
      return []
    }

    const data = await fetchSteamGridDb(`logos/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((logo: any) => logo.url) || []

    // 将游戏 logo 插入数组顶部
    const logoUrl = await getGameLogoByNameFromSteam(gameName)
    if (logoUrl) {
      urls.unshift(logoUrl)
    }
    return urls
  } catch (error) {
    console.error(`Error Getting SteamGridDB Logo:`, error)
    return []
  }
}

export async function getGameIcons(steamId: string): Promise<string[]> {
  try {
    const idData = (await fetchSteamGridDb(`games/steam/${steamId}`)) as {
      data: { id: number }
    }
    const gameId = idData?.data?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${steamId}`)
      return []
    }

    const data = await fetchSteamGridDb(`icons/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((icon: any) => icon.url) || []

    return urls
  } catch (error) {
    console.error(`Error getting SteamGridDB icons:`, error)
    return []
  }
}

export async function getGameIconsByName(gameName: string): Promise<string[]> {
  try {
    const searchData = (await fetchSteamGridDb(
      `search/autocomplete/${encodeURIComponent(gameName)}`
    )) as { data: { id: number }[] }
    const gameId = searchData?.data?.[0]?.id

    if (!gameId) {
      console.warn(`Can't find the game: ${gameName}`)
      return []
    }

    const data = await fetchSteamGridDb(`icons/game/${gameId}`)

    // 直接提取 URL，无需检查
    const urls = data?.data?.map((icon: any) => icon.url) || []

    return urls
  } catch (error) {
    console.error(`Error getting SteamGridDB icons:`, error)
    return []
  }
}

import { SteamGridDBAssets } from './type'

const STEAMGRIDDB_API_KEY = import.meta.env.VITE_STEAMGRIDDB_API_KEY || ''
const TIMEOUT = 5000

// Define multiple API endpoints
const API_ENDPOINTS = ['https://www.steamgriddb.com/api/v2', 'https://api.ximu.dev/steamgriddb/api']

// Define the original CDN and reverse generation address
const ORIGINAL_CDN = 'https://cdn2.steamgriddb.com'
const PROXY_CDN = 'https://api.ximu.dev/steamgriddb/img'

let currentApiIndex = 0

// Timeout-controlled fetch function
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<any> => {
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

// Check if the image URL is accessible
async function checkImageUrl(url: string): Promise<string> {
  if (!url) return ''

  try {
    // Try the original URL first
    const response = await fetchWithTimeout(url, {}, TIMEOUT)
    if (response.ok) {
      return url
    }
  } catch (error) {
    console.warn(`原始图片URL访问失败: ${url}`, error)
  }

  // If the original URL access fails, try using the reverse substitution
  if (url.startsWith(ORIGINAL_CDN)) {
    const proxyUrl = url.replace(ORIGINAL_CDN, PROXY_CDN)
    try {
      const proxyResponse = await fetchWithTimeout(proxyUrl, {}, TIMEOUT)
      if (proxyResponse.ok) {
        return proxyUrl
      }
    } catch (error) {
      console.warn(`反代图片URL访问失败: ${proxyUrl}`, error)
    }
  }

  // If all fail, return the original URL
  return url
}

async function fetchSteamGridDb(
  endpoint: string,
  queryParams?: Record<string, string>
): Promise<any> {
  const params = new URLSearchParams(queryParams)
  const initialApiIndex = currentApiIndex

  // Try all API endpoints
  for (let attempt = 0; attempt < API_ENDPOINTS.length; attempt++) {
    try {
      const baseUrl = API_ENDPOINTS[currentApiIndex]
      const url = `${baseUrl}/${endpoint}${queryParams ? `?${params.toString()}` : ''}`

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
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.warn(`API端点 ${API_ENDPOINTS[currentApiIndex]} 请求失败:`, error)
      // Switch to the next API endpoint
      currentApiIndex = (currentApiIndex + 1) % API_ENDPOINTS.length

      // If all endpoints have been tried, throw an error
      if (currentApiIndex === initialApiIndex) {
        throw error
      }
    }
  }
}

export async function getSteamGridDBAssets(
  identifier: string | number,
  preferredStyle: string = 'official'
): Promise<SteamGridDBAssets> {
  const result: SteamGridDBAssets = {
    hero: '',
    logo: '',
    icon: ''
  }

  try {
    let gameId: number | undefined

    if (typeof identifier === 'string') {
      const searchData = (await fetchSteamGridDb(
        `search/autocomplete/${encodeURIComponent(identifier)}`
      )) as { data: { id: number }[] }
      gameId = searchData?.data?.[0]?.id
    } else {
      const idData = (await fetchSteamGridDb(`games/steam/${identifier}`)) as {
        data: { id: number }
      }
      gameId = idData?.data?.id
    }

    if (!gameId) {
      console.warn(`找不到游戏: ${identifier}`)
      return result
    }

    const getAsset = async (type: 'heroes' | 'logos' | 'icons'): Promise<string> => {
      let data = {} as {
        data: {
          url: string
          style: string
        }[]
      }

      if (type === 'heroes') {
        data = await fetchSteamGridDb(`${type}/game/${gameId}`)
        return data?.data?.[0]?.url || ''
      } else {
        data = await fetchSteamGridDb(`${type}/game/${gameId}`, { styles: preferredStyle })
        if (data?.data?.length > 0) {
          return (
            data.data.find((item: any) => item.style === preferredStyle)?.url || data.data[0].url
          )
        } else {
          const anyStyleData = await fetchSteamGridDb(`${type}/game/${gameId}`)
          return anyStyleData?.data?.[0]?.url || ''
        }
      }
    }

    // Get all resource URLs
    const [heroUrl, logoUrl, iconUrl] = await Promise.all([
      getAsset('heroes'),
      getAsset('logos'),
      getAsset('icons')
    ])

    // Check the accessibility of each URL and switch to the reverse generation if needed
    const [hero, logo, icon] = await Promise.all([
      checkImageUrl(heroUrl),
      checkImageUrl(logoUrl),
      checkImageUrl(iconUrl)
    ])

    return {
      hero,
      logo,
      icon
    }
  } catch (error) {
    console.error(`获取资源时发生错误:`, error)
    return result
  }
}

export async function getGameGrids(identifier: string | number): Promise<string[]> {
  try {
    let gameId: number | undefined

    if (typeof identifier === 'string') {
      const searchData = (await fetchSteamGridDb(
        `search/autocomplete/${encodeURIComponent(identifier)}`
      )) as { data: { id: number }[] }
      gameId = searchData?.data?.[0]?.id
    } else {
      const idData = (await fetchSteamGridDb(`games/steam/${identifier}`)) as {
        data: { id: number }
      }
      gameId = idData?.data?.id
    }

    if (!gameId) {
      console.warn(`找不到游戏: ${identifier}`)
      return []
    }

    const data = await fetchSteamGridDb(`grids/game/${gameId}`)

    // check url
    const urls = await Promise.all(data?.data?.map((grid: any) => checkImageUrl(grid.url)) || [])
    return urls
  } catch (error) {
    console.error(`获取 SteamGridDB 封面时出错:`, error)
    return []
  }
}

export async function getGameHeros(identifier: string | number): Promise<string[]> {
  try {
    let gameId: number | undefined

    if (typeof identifier === 'string') {
      const searchData = (await fetchSteamGridDb(
        `search/autocomplete/${encodeURIComponent(identifier)}`
      )) as { data: { id: number }[] }
      gameId = searchData?.data?.[0]?.id
    } else {
      const idData = (await fetchSteamGridDb(`games/steam/${identifier}`)) as {
        data: { id: number }
      }
      gameId = idData?.data?.id
    }

    if (!gameId) {
      console.warn(`找不到游戏: ${identifier}`)
      return []
    }

    const data = await fetchSteamGridDb(`heroes/game/${gameId}`)

    // check url
    const urls = await Promise.all(data?.data?.map((hero: any) => checkImageUrl(hero.url)) || [])
    return urls
  } catch (error) {
    console.error(`获取 SteamGridDB Hero 时出错:`, error)
    return []
  }
}

export async function getGameLogos(identifier: string | number): Promise<string[]> {
  try {
    let gameId: number | undefined

    if (typeof identifier === 'string') {
      const searchData = (await fetchSteamGridDb(
        `search/autocomplete/${encodeURIComponent(identifier)}`
      )) as { data: { id: number }[] }
      gameId = searchData?.data?.[0]?.id
    } else {
      const idData = (await fetchSteamGridDb(`games/steam/${identifier}`)) as {
        data: { id: number }
      }
      gameId = idData?.data?.id
    }

    if (!gameId) {
      console.warn(`找不到游戏: ${identifier}`)
      return []
    }

    const data = await fetchSteamGridDb(`logos/game/${gameId}`)

    // check url
    const urls = await Promise.all(data?.data?.map((logo: any) => checkImageUrl(logo.url)) || [])
    return urls
  } catch (error) {
    console.error(`获取 SteamGridDB Logo 时出错:`, error)
    return []
  }
}

export async function getGameIcons(identifier: string | number): Promise<string[]> {
  try {
    let gameId: number | undefined

    if (typeof identifier === 'string') {
      const searchData = (await fetchSteamGridDb(
        `search/autocomplete/${encodeURIComponent(identifier)}`
      )) as { data: { id: number }[] }
      gameId = searchData?.data?.[0]?.id
    } else {
      const idData = (await fetchSteamGridDb(`games/steam/${identifier}`)) as {
        data: { id: number }
      }
      gameId = idData?.data?.id
    }

    if (!gameId) {
      console.warn(`找不到游戏: ${identifier}`)
      return []
    }

    const data = await fetchSteamGridDb(`icons/game/${gameId}`)

    // check url
    const urls = await Promise.all(data?.data?.map((icon: any) => checkImageUrl(icon.url)) || [])
    return urls
  } catch (error) {
    console.error(`获取 SteamGridDB 图标时出错:`, error)
    return []
  }
}

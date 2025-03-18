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
    console.warn(`Original Image URL Access Failed: ${url}`, error)
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
      console.warn(`Failed to access the URL of the reverse proxy image: ${proxyUrl}`, error)
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
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.warn(`API endpoint ${API_ENDPOINTS[currentApiIndex]} request failed:`, error)
      // Switch to the next API endpoint
      currentApiIndex = (currentApiIndex + 1) % API_ENDPOINTS.length

      // If all endpoints have been tried, throw an error
      if (currentApiIndex === initialApiIndex) {
        throw error
      }
    }
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

    // check url
    const urls = await Promise.all(data?.data?.map((grid: any) => checkImageUrl(grid.url)) || [])

    // Insert the game cover at the top of the array
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
    // check url
    const urls = await Promise.all(data?.data?.map((grid: any) => checkImageUrl(grid.url)) || [])

    // Insert the game cover at the top of the array
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

    // check url
    const urls = await Promise.all(data?.data?.map((hero: any) => checkImageUrl(hero.url)) || [])

    // Insert the game's Background image at the top of the array
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

    // check url
    const urls = await Promise.all(data?.data?.map((hero: any) => checkImageUrl(hero.url)) || [])

    // Insert the game's Background image at the top of the array.
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

    // check url
    const urls = await Promise.all(data?.data?.map((logo: any) => checkImageUrl(logo.url)) || [])

    // Insert the game logo at the top of the array
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

    // check url
    const urls = await Promise.all(data?.data?.map((logo: any) => checkImageUrl(logo.url)) || [])

    // Insert the game logo at the top of the array
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

    // check url
    const urls = await Promise.all(data?.data?.map((icon: any) => checkImageUrl(icon.url)) || [])

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

    // check url
    const urls = await Promise.all(data?.data?.map((icon: any) => checkImageUrl(icon.url)) || [])

    return urls
  } catch (error) {
    console.error(`Error getting SteamGridDB icons:`, error)
    return []
  }
}

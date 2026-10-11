import { isHttpError } from '../../errors'
import { createScraperFetch, readScraperJson } from '../../request'
import {
  getGameBackgroundsByName as getGameBackgroundsByNameFromSteam,
  getGameBackgrounds as getGameBackgroundsFromSteam,
  getGameCoverByName as getGameCoverByNameFromSteam,
  getGameCover as getGameCoverFromSteam,
  getGameLogoByName as getGameLogoByNameFromSteam,
  getGameLogo as getGameLogoFromSteam
} from '../steam/common'

const fetch = createScraperFetch()

const STEAMGRIDDB_API_KEY = import.meta.env.VITE_STEAMGRIDDB_API_KEY || ''

const API_ENDPOINT = 'https://www.steamgriddb.com/api/v2'

async function fetchSteamGridDb(
  endpoint: string,
  queryParams?: Record<string, string>
): Promise<any> {
  const params = new URLSearchParams(queryParams)
  const url = `${API_ENDPOINT}/${endpoint}${queryParams ? `?${params.toString()}` : ''}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${STEAMGRIDDB_API_KEY}`
    }
  })

  return await readScraperJson(response)
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

    const urls = data?.data?.map((grid: any) => grid.url) || []

    // Put the steam official cover at the beginning of the array
    const coverUrl = await getGameCoverFromSteam(steamId)
    if (coverUrl) {
      urls.unshift(coverUrl)
    }
    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((grid: any) => grid.url) || []

    // Put the steam official cover at the beginning of the array
    const coverUrl = await getGameCoverByNameFromSteam(gameName)
    if (coverUrl) {
      urls.unshift(coverUrl)
    }
    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((hero: any) => hero.url) || []

    // Put the steam official background at the beginning of the array
    const heroUrl = await getGameBackgroundsFromSteam(steamId)
    if (heroUrl[0]) {
      urls.unshift(heroUrl[0])
    }
    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((hero: any) => hero.url) || []

    // Put the steam official background at the beginning of the array
    const heroUrl = await getGameBackgroundsByNameFromSteam(gameName)
    if (heroUrl[0]) {
      urls.unshift(heroUrl[0])
    }
    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((logo: any) => logo.url) || []

    // Put the steam official logo at the beginning of the array
    const logoUrl = await getGameLogoFromSteam(steamId)
    if (logoUrl) {
      urls.unshift(logoUrl)
    }
    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((logo: any) => logo.url) || []

    // Put the steam official logo at the beginning of the array
    const logoUrl = await getGameLogoByNameFromSteam(gameName)
    if (logoUrl) {
      urls.unshift(logoUrl)
    }
    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((icon: any) => icon.url) || []

    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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

    const urls = data?.data?.map((icon: any) => icon.url) || []

    return urls
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
  }
}

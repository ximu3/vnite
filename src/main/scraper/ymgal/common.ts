import { GameList, GameMetadata } from '../types'
import { getGameScreenshotsByTitleFromVNDB, getGameCoverByTitleFromVNDB } from '../vndb'
import { GameListResponse, GameDetailResponse, OrganizationResponse, Organization } from './type'

// Define the base URL for the Moon Screen API
const BASE_URL = 'https://www.ymgal.games'
const API_VERSION = '1'

// Defining API Response Types
interface YMGalResponse<T> {
  success: boolean
  code: number
  msg?: string
  data: T
}

// Define the Token response type
interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

// Get Access Token
async function getAccessToken(): Promise<string> {
  const tokenEndpoint = `${BASE_URL}/oauth/token`
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'ymgal',
    client_secret: 'luna0327',
    scope: 'public'
  })

  try {
    const response = await fetch(`${tokenEndpoint}?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = (await response.json()) as TokenResponse
    return data.access_token
  } catch (error) {
    console.error('Error fetching access token:', error)
    throw error
  }
}

// Basic API Request Functions
async function fetchYMGal<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken()
  const url = new URL(endpoint, BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json;charset=utf-8',
      Authorization: `Bearer ${token}`,
      version: API_VERSION
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = (await response.json()) as YMGalResponse<T>
  if (!data.success) {
    throw new Error(data.msg || `API error! code: ${data.code}`)
  }

  return data.data
}

// Search games
export async function searchYMGalGames(gameName: string): Promise<GameList> {
  try {
    const data = await fetchYMGal<GameListResponse>('/open/archive/search-game', {
      mode: 'list',
      keyword: gameName,
      pageNum: '1',
      pageSize: '20'
    })

    return data.result.map((game: any) => ({
      id: game.id.toString(),
      name: game.name,
      chineseName: game.chineseName,
      releaseDate: game.releaseDate || '',
      developers: [game.orgName].filter(Boolean)
    }))
  } catch (error) {
    console.error('Error searching YMGal games:', error)
    throw error
  }
}

// Functions to get developer details
async function getOrganizationDetail(orgId: number): Promise<Organization> {
  const data = await fetchYMGal<OrganizationResponse>('/open/archive', {
    orgId: orgId.toString()
  })
  return data.org
}

// Getting game metadata
export async function getYMGalMetadata(gameId: string): Promise<GameMetadata> {
  try {
    const data = await fetchYMGal<GameDetailResponse>('/open/archive', {
      gid: gameId
    })

    const game = data.game

    // Get Developer Details
    let developerName = ''
    if (game.developerId) {
      try {
        const orgData = await getOrganizationDetail(game.developerId)
        developerName = orgData.chineseName || orgData.name
      } catch (error) {
        console.warn(`Failed to fetch developer info for ID ${game.developerId}:`, error)
      }
    }

    return {
      name: game.chineseName || game.name,
      originalName: game.name,
      releaseDate: game.releaseDate || '',
      description: game.introduction || '',
      developers: developerName ? [developerName] : [],
      relatedSites:
        game.website?.map((site) => ({
          label: site.title,
          url: site.link
        })) || [],
      tags: game.tags || []
    }
  } catch (error) {
    console.error(`Error fetching YMGal metadata for game ${gameId}:`, error)
    throw error
  }
}

// Check if the game exists
export async function checkYMGalExists(gameId: string): Promise<boolean> {
  try {
    await fetchYMGal('/open/archive', {
      gid: gameId
    })
    return true
  } catch (error) {
    console.error(`Error checking YMGal game existence for ID ${gameId}:`, error)
    return false
  }
}

// Get Game Cover
export async function getYMGalCover(gameId: string): Promise<string> {
  try {
    const data = await fetchYMGal<GameDetailResponse>('/open/archive', {
      gid: gameId
    })
    return await getGameCoverByTitleFromVNDB(data.game.name)
  } catch (error) {
    console.error(`Error fetching YMGal cover for game ${gameId}:`, error)
    return ''
  }
}

// Get Game Screenshots
export async function getYMGalScreenshots(gameId: string): Promise<string[]> {
  try {
    const data = await fetchYMGal<GameDetailResponse>('/open/archive', {
      gid: gameId
    })
    return await getGameScreenshotsByTitleFromVNDB(data.game.name)
  } catch (error) {
    console.error(`Error fetching YMGal screenshots for game ${gameId}:`, error)
    return []
  }
}

import { GameList, GameMetadata } from '@appTypes/utils'
import { GameListResponse, GameDetailResponse, OrganizationResponse, Organization } from './type'
import { getGameBackgroundsFromVNDB, getGameCoverFromVNDB } from '../vndb'
import i18next from 'i18next'
import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/database'

// YMGal job titles mapped to predefined roles
const YMGAL_ROLE_MAPPING: Record<string, string> = {
  脚本: 'scenario',

  原画: 'illustration',
  人物设计: 'illustration',

  '导演/监督': 'director',

  音乐: 'music',
  歌曲: 'music'
}

// Define the base URL for the YMGal API
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

// Process staff data function for YMGal
function processYMGalStaffData(
  staffList: Array<{
    sid: number
    pid?: number
    jobName: string
    desc?: string
    empName: string
  }>
): Array<{ key: string; value: string[] }> {
  // Group staff by role
  const staffByRole: Record<string, Set<string>> = {}
  // Translation map, stores the translated role name for each mapped role
  const translationMap: Record<string, string> = {}

  // Process each staff member
  staffList.forEach((staffMember) => {
    // Extract job name and handle potential parentheses content
    const jobName = staffMember.jobName.trim()

    // Check if the role exists in the mapping table
    const mappedRole = YMGAL_ROLE_MAPPING[jobName]
    if (mappedRole && METADATA_EXTRA_PREDEFINED_KEYS.includes(mappedRole)) {
      // Translate role name using i18next
      const translatedRole = i18next.t(`scraper:extraMetadataFields.${mappedRole}`)
      translationMap[mappedRole] = translatedRole

      // Staff name with description if available
      let staffName = staffMember.empName
      if (staffMember.desc) {
        staffName = `${staffName} (${staffMember.desc})`
      }

      // Add to corresponding role group (using Set for automatic deduplication)
      if (!staffByRole[mappedRole]) {
        staffByRole[mappedRole] = new Set()
      }
      staffByRole[mappedRole].add(staffName)
    }
  })

  // Generate results according to the order in METADATA_EXTRA_PREDEFINED_KEYS
  return METADATA_EXTRA_PREDEFINED_KEYS.filter((role) => staffByRole[role]) // Only keep roles that have data
    .map((role) => ({
      key: translationMap[role],
      value: Array.from(staffByRole[role])
    }))
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

    // Process staff data
    const staffData = game.staff ? processYMGalStaffData(game.staff) : []

    return {
      name: game.chineseName || game.name,
      originalName: game.name,
      releaseDate: game.releaseDate || '',
      description: game.introduction || '',
      developers: developerName ? [developerName] : [],
      relatedSites: [
        ...(game.website?.map((site) => ({
          label: site.title,
          url: site.link
        })) || []),
        { label: '月幕Galgame', url: `https://www.ymgal.games/ga${gameId}` }
      ],
      tags: game.tags || [],
      extra: staffData
    }
  } catch (error) {
    console.error(`Error fetching YMGal metadata for game ${gameId}:`, error)
    throw error
  }
}

export async function getYMGalMetadataByName(gameName: string): Promise<GameMetadata> {
  try {
    const game = (await searchYMGalGames(gameName))[0]
    if (!game) {
      return {
        name: gameName,
        originalName: gameName,
        developers: [],
        tags: [],
        relatedSites: [],
        releaseDate: '',
        description: '',
        extra: []
      }
    }
    return await getYMGalMetadata(game.id)
  } catch (error) {
    console.error(`Error fetching YMGal metadata for game ${gameName}:`, error)
    throw error
  }
}

export async function getGameBackgrounds(gameId: string): Promise<string[]> {
  try {
    const data = await fetchYMGal<GameDetailResponse>('/open/archive', {
      gid: gameId
    })

    const gameName = data.game.name

    return await getGameBackgroundsFromVNDB({
      type: 'name',
      value: gameName
    })
  } catch (error) {
    console.error(`Error fetching YMGal game backgrounds for ID ${gameId}:`, error)
    throw error
  }
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  try {
    return await getGameBackgroundsFromVNDB({
      type: 'name',
      value: gameName
    })
  } catch (error) {
    console.error(`Error fetching YMGal game backgrounds for name ${gameName}:`, error)
    throw error
  }
}

// Get game cover
export async function getGameCover(gameId: string): Promise<string> {
  try {
    const data = await fetchYMGal<GameDetailResponse>('/open/archive', {
      gid: gameId
    })
    const gameName = data.game.name
    return await getGameCoverFromVNDB({
      type: 'name',
      value: gameName
    })
  } catch (error) {
    console.error(`Error fetching YMGal game cover for ID ${gameId}:`, error)
    throw error
  }
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  try {
    return await getGameCoverFromVNDB({
      type: 'name',
      value: gameName
    })
  } catch (error) {
    console.error(`Error fetching YMGal game cover for name ${gameName}:`, error)
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

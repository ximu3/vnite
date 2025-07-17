import { GameList, GameMetadata } from '@appTypes/utils'
import { BangumiSearchResult, BangumiSubject } from './types'
import { getGameBackgroundsFromVNDB } from '../vndb/api'
import i18next from 'i18next'
import { net } from 'electron'
import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/models'

// Mapping table from Bangumi fields to predefined roles
const BANGUMI_ROLE_MAPPING: Record<string, string> = {
  // Director/Planning related
  企画: 'director',
  监督: 'director',
  制作人: 'director',
  原作: 'director',

  // Scenario related
  剧本: 'scenario',
  脚本: 'scenario',
  系列构成: 'scenario',
  剧本协力: 'scenario',

  // Illustration/Art related
  原画: 'illustration',
  美工: 'illustration',
  人物设定: 'illustration',
  角色设计: 'illustration',

  // Music related
  音乐: 'music',
  BGM: 'music',
  作曲: 'music',
  音效: 'music',
  主题歌作曲: 'music',

  // Engine related
  游戏引擎: 'engine',
  引擎: 'engine'
}

// Process staff data from Bangumi infobox
function processBangumiStaffData(
  infobox: { key: string; value: any }[] | undefined
): Array<{ key: string; value: string[] }> {
  if (!infobox) return []

  // Group staff by role
  const staffByRole: Record<string, Set<string>> = {}
  // Translation map, stores the translated role name for each mapped role
  const translationMap: Record<string, string> = {}

  // Process each infobox item
  infobox.forEach((item) => {
    // Check if the key exists in our mapping
    const mappedRole = BANGUMI_ROLE_MAPPING[item.key]
    if (mappedRole && METADATA_EXTRA_PREDEFINED_KEYS.includes(mappedRole)) {
      // Translate role name using i18next
      const translatedRole = i18next.t(`scraper:extraMetadataFields.${mappedRole}`)
      translationMap[mappedRole] = translatedRole

      // Get staff names from the value
      let staffNames: string[] = []
      if (typeof item.value === 'string') {
        // Split by common separators in Bangumi data
        staffNames = item.value.split(/[、,，]/)
      } else if (Array.isArray(item.value)) {
        staffNames = item.value
      }

      // Process each staff name
      staffNames.forEach((name) => {
        // Clean up the name
        const cleanName = name.trim()
        if (cleanName) {
          // Add to corresponding role group (using Set for automatic deduplication)
          if (!staffByRole[mappedRole]) {
            staffByRole[mappedRole] = new Set()
          }
          staffByRole[mappedRole].add(cleanName)
        }
      })
    }
  })

  // Generate results according to the order in METADATA_EXTRA_PREDEFINED_KEYS
  return METADATA_EXTRA_PREDEFINED_KEYS.filter((role) => staffByRole[role]) // Only keep roles that have data
    .map((role) => ({
      key: translationMap[role],
      value: Array.from(staffByRole[role])
    }))
}

async function fetchBangumi<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const url = new URL(`https://api.bgm.tv/${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const apiKey = process.env.VITE_BANGUMI_API_KEY || ''

  const response = await net.fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ximu3/vnite/3.0.0-alpha.0 (https://github.com/ximu3/vnite)',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    }
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function searchBangumiGames(gameName: string): Promise<GameList> {
  try {
    // URL encoding of game names
    const encodedGameName = encodeURIComponent(gameName)

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

/**
 * Generic function to extract field data from infobox
 * @param infobox infobox data
 * @param fields Array of field names to search for
 * @param options Configuration options
 * @returns Extracted data
 */
function getInfoboxField<T = string[]>(
  infobox: { key: string; value: any }[] | undefined,
  fields: string[],
  options: {
    separator?: string
    transform?: (value: any) => T
  } = {}
): T {
  if (!infobox) return [] as unknown as T

  const { separator = '、', transform } = options

  // Iterate through all possible field names, return the first value that exists
  for (const field of fields) {
    const entry = infobox.find((item) => item.key === field)
    if (entry?.value) {
      // If a custom transform function is provided, use it
      if (transform) {
        return transform(entry.value)
      }

      // Process array values
      if (Array.isArray(entry.value)) {
        // Check if it's an array of strings
        if (typeof entry.value[0] === 'string') {
          return entry.value as unknown as T
        }
        // Process array of objects, convert to array of strings
        return entry.value.map(
          (item: { [key: string]: string }) => Object.values(item)[0]
        ) as unknown as T
      }

      // Process string values, split by separator
      return entry.value.split(separator) as unknown as T
    }
  }

  return [] as unknown as T
}

// Constant field definitions
const DEVELOPER_FIELDS = ['开发', '游戏开发商', '开发商', 'Developer', 'Developers']
const PUBLISHER_FIELDS = ['发行', '发行商', 'Publisher', 'Publishers']
const GENRE_FIELDS = ['类型', '游戏类型']

function getDevelopers(infobox: { key: string; value: any }[] | undefined): string[] {
  return getInfoboxField(infobox, DEVELOPER_FIELDS)
}

function getPublishers(infobox: { key: string; value: any }[] | undefined): string[] {
  return getInfoboxField(infobox, PUBLISHER_FIELDS)
}

function getRelatedSites(
  infobox: { key: string; value: any }[] | undefined
): { label: string; url: string }[] {
  return getInfoboxField<{ label: string; url: string }[]>(infobox, ['website'], {
    transform: (value) => {
      if (Array.isArray(value)) {
        return value.map((site) => ({ label: site?.k, url: site?.v }))
      }
      return [{ label: '官方网站', url: value }]
    }
  })
}

function getGenres(infobox: { key: string; value: any }[] | undefined): string[] {
  return getInfoboxField(infobox, GENRE_FIELDS, { separator: ' / ' })
}

export async function getBangumiMetadata(gameId: string): Promise<GameMetadata> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)

    // Process staff data from infobox
    const staffData = processBangumiStaffData(game.infobox)

    return {
      name: game?.name_cn || game.name,
      originalName: game.name,
      releaseDate: game.date || '',
      description: game.summary || '',
      genres: getGenres(game.infobox),
      publishers: getPublishers(game.infobox),
      developers: getDevelopers(game.infobox),
      relatedSites: [
        ...getRelatedSites(game.infobox),
        { label: 'Bangumi', url: `https://bgm.tv/subject/${gameId}` }
      ],
      tags: game.tags?.map((tag) => tag.name) || [],
      extra: staffData
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameId}:`, error)
    throw error
  }
}

export async function getBangumiMetadataByName(gameName: string): Promise<GameMetadata> {
  try {
    const games = await searchBangumiGames(gameName)
    if (games.length === 0) {
      return {
        name: gameName,
        originalName: gameName,
        releaseDate: '',
        description: '',
        developers: [],
        relatedSites: [],
        tags: [],
        extra: []
      }
    }
    return await getBangumiMetadata(games[0].id)
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameName}:`, error)
    throw error
  }
}

export async function checkGameExists(gameId: string): Promise<boolean> {
  try {
    await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)
    return true
  } catch (error) {
    console.error(`Error checking game existence for ID ${gameId}:`, error)
    return false
  }
}

export async function getGameBackgrounds(gameId: string): Promise<string[]> {
  try {
    const data = await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)
    return await getGameBackgroundsFromVNDB({
      type: 'name',
      value: data.name
    })
  } catch (error) {
    console.error(`Error fetching backgrounds for game ${gameId}:`, error)
    return []
  }
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  try {
    return await getGameBackgroundsFromVNDB({
      type: 'name',
      value: gameName
    })
  } catch (error) {
    console.error(`Error fetching backgrounds for game ${gameName}:`, error)
    return []
  }
}

export async function getGameCover(gameId: string): Promise<string> {
  try {
    const game = await fetchBangumi<BangumiSubject>(`v0/subjects/${gameId}`)
    return game.images.large || ''
  } catch (error) {
    console.error(`Error fetching cover for game ${gameId}:`, error)
    return ''
  }
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  try {
    const games = await searchBangumiGames(gameName)
    if (games.length === 0) {
      return ''
    }
    return await getGameCover(games[0].id)
  } catch (error) {
    console.error(`Error fetching cover for game ${gameName}:`, error)
    return ''
  }
}

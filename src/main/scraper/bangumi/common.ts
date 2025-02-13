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

const DEVELOPER_FIELDS = ['开发', '游戏开发商', '开发商', 'Developer', 'Developers']

// helper function: get developer info from infoBox
function getDevelopers(infobox: { key: string; value: string }[] | undefined): string[] {
  if (!infobox) return []

  // Iterates over all possible field names, returning the first value that exists
  for (const field of DEVELOPER_FIELDS) {
    const developerEntry = infobox.find((entry) => entry.key === field)
    if (developerEntry?.value) {
      // If it's an array then it returns directly
      if (Array.isArray(developerEntry.value)) {
        // Determine if it is an array of strings
        if (typeof developerEntry.value[0] === 'string') {
          return developerEntry.value
        }
        // Determine whether it is an array of objects, quasi-exchange for an array of strings, the key is not determined, directly take the value of the
        return developerEntry.value.map((item: { [key: string]: string }) => Object.values(item)[0])
      }
      // Converting String Values to Arrays
      return developerEntry.value.split('、')
    }
  }

  return []
}

const PUBLISHER_FIELDS = ['发行', '发行商', 'Publisher', 'Publishers']

// helper function: get publisher info from infoBox
function getPublishers(infobox: { key: string; value: string }[] | undefined): string[] {
  if (!infobox) return []

  // Iterates over all possible field names, returning the first value that exists
  for (const field of PUBLISHER_FIELDS) {
    const publisherEntry = infobox.find((entry) => entry.key === field)
    if (publisherEntry) {
      // Converting String Values to Arrays
      return publisherEntry.value.split('、')
    }
  }

  return []
}

// helper function: get site info from infoBox
function getRelatedSites(
  infobox: { key: string; value: string }[] | undefined
): { label: string; url: string }[] {
  if (!infobox) return []

  // Find entries with key 'websites
  const websiteEntry = infobox.find((entry) => entry.key === 'website')
  if (websiteEntry) {
    if (Array.isArray(websiteEntry.value)) {
      return websiteEntry.value.map((site) => ({ label: site?.k, url: site?.v }))
    }
    return [{ label: '官方网站', url: websiteEntry.value }]
  }

  return []
}

const GENRE_FIELDS = ['类型', '游戏类型']

function getGenres(infobox: { key: string; value: string }[] | undefined): string[] {
  if (!infobox) return []

  // Iterates over all possible field names, returning the first value that exists
  for (const field of GENRE_FIELDS) {
    const genreEntry = infobox.find((entry) => entry.key === field)
    if (genreEntry) {
      // Converting String Values to Arrays
      return genreEntry.value.split(' / ')
    }
  }

  return []
}

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
      relatedSites: [
        ...getRelatedSites(game.infobox),
        { label: 'Bangumi', url: `https://bangumi.tv/subject/${gameId}` }
      ],
      tags: game.tags?.map((tag) => tag.name) || []
    }
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameId}:`, error)
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

export async function getGameScreenshots(gameId: string): Promise<string[]> {
  try {
    const gameName = (await getBangumiMetadata(gameId)).originalName
    return await getGameScreenshotsByTitleFromVNDB(gameName!)
  } catch (error) {
    console.error(`Error fetching images for game ${gameId}:`, error)
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

export async function getGameCoverByTitle(gameName: string): Promise<string> {
  try {
    const game = (await searchBangumiGames(gameName))[0]
    return await getGameCover(game.id)
  } catch (error) {
    console.error(`Error fetching cover for game ${gameName}:`, error)
    return ''
  }
}

import { formatDescription } from './parser'
import {
  VNDBRequestParams,
  VNDBResponse,
  VNBasicInfo,
  VNDetailInfo,
  VNWithScreenshots,
  VNWithCover,
  SimpleGameInfo,
  VNTitle,
  VNStaff
} from './types'
import { GameMetadata } from '@appTypes/utils'
import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/models'
import { ConfigDBManager } from '~/core/database'
import i18next from 'i18next'
import { fetchProxy } from '../../utils/ScraperUtils'

const SCRAPER_ID = 'vndb'

const VNDB_ROLE_MAPPING: Record<string, string> = {
  director: 'director',
  scenario: 'scenario',
  chardesign: 'illustration',
  art: 'illustration',
  music: 'music',
  songs: 'music'
}

async function fetchVNDB<T>(params: VNDBRequestParams): Promise<VNDBResponse<T>> {
  const endpoint = 'https://api.vndb.org/kana/vn'
  const TIMEOUT_MS = 10000

  const fields = Array.isArray(params.fields) ? params.fields.join(',') : params.fields

  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...params,
      fields
    })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetchProxy(SCRAPER_ID, endpoint, {
      ...requestConfig,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return (await response.json()) as VNDBResponse<T>
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('abort')) {
      throw new Error(`Timeout exceeded (${TIMEOUT_MS}ms) for ${endpoint}`)
    } else {
      throw new Error(`Failed to fetch from ${endpoint}: ${errorMessage}`)
    }
  }
}

function processStaffData(staff: VNStaff[]): Array<{ key: string; value: string[] }> {
  // Group staff by role
  const staffByRole: Record<string, Set<string>> = {}

  // Process each staff member
  staff.forEach((staffMember) => {
    // Check if the role exists in the mapping table
    const mappedRole = VNDB_ROLE_MAPPING[staffMember.role]
    if (mappedRole && METADATA_EXTRA_PREDEFINED_KEYS.includes(mappedRole)) {
      // Add to corresponding role group (using Set for automatic deduplication)
      if (!staffByRole[mappedRole]) {
        staffByRole[mappedRole] = new Set()
      }
      staffByRole[mappedRole].add(staffMember.original || staffMember.name)
    }
  })

  // Generate results according to the order in METADATA_EXTRA_PREDEFINED_KEYS
  return METADATA_EXTRA_PREDEFINED_KEYS.filter((role) => staffByRole[role]) // Only keep roles that have data
    .map((role) => ({
      key: role,
      value: Array.from(staffByRole[role])
    }))
}

export async function searchVNDBGames(gameName: string): Promise<SimpleGameInfo[]> {
  const fields = ['titles{main,title}', 'released', 'developers{name}', 'id']

  try {
    const data = await fetchVNDB<VNBasicInfo>({
      filters: ['search', '=', gameName],
      fields,
      results: 30
    })

    return data.results.map((game) => ({
      id: game.id,
      name: game.titles.find((t) => t.main)?.title || game.titles[0].title,
      releaseDate: game?.released || '',
      developers: game.developers?.map((d) => d.name) || ['']
    }))
  } catch (error) {
    console.error('Error fetching VNDB ', error)
    throw error
  }
}

export async function getVNMetadata(vnId: string): Promise<GameMetadata> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`

  const fields = [
    'titles{main,title,lang}',
    'released',
    'description',
    'developers{name,original}',
    'tags{rating,name,spoiler}',
    'extlinks{label,url}',
    'staff{role,name,original}'
  ]

  try {
    const data = await fetchVNDB<VNDetailInfo>({
      filters: ['id', '=', formattedId],
      fields
    })

    if (!data.results.length) {
      throw new Error(`No visual novel found with ID: ${vnId}`)
    }

    const vn = data.results[0]
    const staffData = processStaffData(vn.staff)

    const spoilerTagsLevel = await ConfigDBManager.getConfigValue(
      'game.scraper.vndb.tagSpoilerLevel'
    )

    if (spoilerTagsLevel === 0) {
      vn.tags = vn.tags?.filter((tag) => tag.spoiler === 0)
    } else if (spoilerTagsLevel === 1) {
      vn.tags = vn.tags?.filter((tag) => tag.spoiler <= 1)
    } else {
      vn.tags = vn.tags?.filter((tag) => tag.spoiler <= 2)
    }

    const languageCode = i18next.t('scraper:vndb.languageCode')

    return {
      name:
        vn.titles.find((t) => t.lang === languageCode)?.title ||
        vn.titles.find((t) => t.main)?.title ||
        vn.titles[0].title,
      originalName: vn.titles.find((t) => t.main)?.title || vn.titles[0].title,
      releaseDate: vn.released || '',
      description: formatDescription(vn.description),
      developers: vn.developers?.map((d) => d.original || d.name) || [''],
      relatedSites: [
        ...(vn.extlinks?.map((link) => ({ label: link.label, url: link.url })) || []),
        { label: 'VNDB', url: `https://vndb.org/${formattedId}` }
      ],
      tags: vn.tags?.sort((a, b) => b.rating - a.rating).map((tag) => tag.name) ?? [],
      extra: staffData
    }
  } catch (error) {
    console.error(`Error fetching metadata for VN ${vnId}:`, error)
    throw error
  }
}

export async function getVNMetadataByName(vnName: string): Promise<GameMetadata> {
  const fields = [
    'id',
    'titles{main,title}',
    'released',
    'description',
    'developers{name,original}',
    'tags{rating,name,spoiler}',
    'extlinks{label,url}',
    'staff{role,name,original}'
  ]

  try {
    const data = await fetchVNDB<VNDetailInfo>({
      filters: ['search', '=', vnName],
      fields
    })

    if (!data.results.length) {
      return {
        name: vnName,
        originalName: vnName,
        releaseDate: '',
        description: '',
        developers: [],
        relatedSites: [],
        tags: [],
        extra: []
      }
    }

    const vn = data.results[0]
    const staffData = processStaffData(vn.staff)

    const spoilerTagsLevel = await ConfigDBManager.getConfigValue(
      'game.scraper.vndb.tagSpoilerLevel'
    )

    if (spoilerTagsLevel === 0) {
      vn.tags = vn.tags?.filter((tag) => tag.spoiler === 0)
    } else if (spoilerTagsLevel === 1) {
      vn.tags = vn.tags?.filter((tag) => tag.spoiler <= 1)
    } else {
      vn.tags = vn.tags?.filter((tag) => tag.spoiler <= 2)
    }

    return {
      name: vn.titles.find((t) => t.main)?.title || vn.titles[0].title,
      originalName: vn.titles.find((t) => t.main)?.title || vn.titles[0].title,
      releaseDate: vn.released || '',
      description: formatDescription(vn.description),
      developers: vn.developers?.map((d) => d.original || d.name) || [''],
      relatedSites: [
        ...(vn.extlinks?.map((link) => ({ label: link.label, url: link.url })) || []),
        { label: 'VNDB', url: `https://vndb.org/${vn.id}` }
      ],
      tags: vn.tags?.sort((a, b) => b.rating - a.rating).map((tag) => tag.name) ?? [],
      extra: staffData
    }
  } catch (error) {
    console.error(`Error fetching metadata for VN ${vnName}:`, error)
    throw error
  }
}

export async function checkVNExists(vnId: string): Promise<boolean> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`
  const fields = ['title']

  try {
    const data = await fetchVNDB<{ title: string }>({
      filters: ['id', '=', formattedId],
      fields,
      results: 1
    })

    return data.results.length > 0
  } catch (error) {
    console.error(`Error checking VN existence for ID ${vnId}:`, error)
    return false
  }
}

export async function getGameBackgrounds(vnId: string): Promise<string[]> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`
  const fields = ['screenshots{url}']

  try {
    const data = await fetchVNDB<VNWithScreenshots>({
      filters: ['id', '=', formattedId],
      fields,
      results: 1
    })

    return data.results[0].screenshots.map((screenshot) => screenshot.url)
  } catch (error) {
    console.error(`Error fetching images for VN ${vnId}:`, error)
    return []
  }
}

export async function getGameBackgroundsByName(name: string): Promise<string[]> {
  const fields = ['titles{title}', 'screenshots{url}']

  interface VNWithScreenshotsAndTitles extends VNWithScreenshots {
    titles: VNTitle[]
  }

  try {
    const data = await fetchVNDB<VNWithScreenshotsAndTitles>({
      filters: ['search', '=', name],
      fields
    })

    if (data.results.length > 0) {
      let vn = data.results.find((result) =>
        result.titles.some((titleJson) => titleJson.title.toLowerCase() === name.toLowerCase())
      )
      vn = vn || data.results[0]

      return vn.screenshots.map((screenshot) => screenshot.url)
    }
    return []
  } catch (error) {
    console.error(`Error fetching images for VN ${name}:`, error)
    return []
  }
}

export async function getGameCover(vnId: string): Promise<string> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`
  const fields = ['image{url}']

  try {
    const data = await fetchVNDB<VNWithCover>({
      filters: ['id', '=', formattedId],
      fields,
      results: 1
    })

    return data.results[0].image.url
  } catch (error) {
    console.error(`Error fetching cover for VN ${vnId}:`, error)
    return ''
  }
}

export async function getGameCoverByName(name: string): Promise<string> {
  const fields = ['image{url}']

  try {
    const data = await fetchVNDB<VNWithCover>({
      filters: ['search', '=', name],
      fields,
      results: 1
    })

    return data.results[0].image.url
  } catch (error) {
    console.error(`Error fetching cover for VN ${name}:`, error)
    return ''
  }
}

import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/models'
import { GameMetadata } from '@appTypes/utils'
import i18next from 'i18next'
import { ConfigDBManager } from '~/core/database'
import { createScraperFetch, readScraperJson } from '../../request'
import { formatDescription } from './parser'
import {
  SimpleGameInfo,
  VNBasicInfo,
  VNDBRequestParams,
  VNDBResponse,
  VNDetailInfo,
  VNStaff,
  VNTitle,
  VNWithCover,
  VNWithScreenshots
} from './types'

const fetch = createScraperFetch()

const VNDB_SEARCH_SORT = 'searchrank'

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

  const response = await fetch(endpoint, requestConfig)
  return await readScraperJson<VNDBResponse<T>>(response)
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

  const data = await fetchVNDB<VNBasicInfo>({
    filters: ['search', '=', gameName],
    fields,
    sort: VNDB_SEARCH_SORT,
    results: 30
  })

  return data.results.map((game) => ({
    id: game.id,
    name: game.titles.find((t) => t.main)?.title || game.titles[0].title,
    releaseDate: game?.released || '',
    developers: game.developers?.map((d) => d.name) || ['']
  }))
}

export async function getVNMetadata(vnId: string): Promise<GameMetadata | null> {
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

  const data = await fetchVNDB<VNDetailInfo>({
    filters: ['id', '=', formattedId],
    fields
  })

  if (!data.results.length) {
    return null
  }

  const vn = data.results[0]
  const staffData = processStaffData(vn.staff)

  const spoilerTagsLevel = await ConfigDBManager.getConfigValue('game.scraper.vndb.tagSpoilerLevel')

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
}

export async function getVNMetadataByName(vnName: string): Promise<GameMetadata | null> {
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

  const data = await fetchVNDB<VNDetailInfo>({
    filters: ['search', '=', vnName],
    fields,
    sort: VNDB_SEARCH_SORT
  })

  if (!data.results.length) {
    return null
  }

  const vn = data.results[0]
  const staffData = processStaffData(vn.staff)

  const spoilerTagsLevel = await ConfigDBManager.getConfigValue('game.scraper.vndb.tagSpoilerLevel')

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
}

export async function checkVNExists(vnId: string): Promise<boolean> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`
  const fields = ['title']

  const data = await fetchVNDB<{ title: string }>({
    filters: ['id', '=', formattedId],
    fields,
    results: 1
  })

  return data.results.length > 0
}

export async function getGameBackgrounds(vnId: string): Promise<string[]> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`
  const fields = ['screenshots{url}']

  const data = await fetchVNDB<VNWithScreenshots>({
    filters: ['id', '=', formattedId],
    fields,
    results: 1
  })

  return data.results[0]?.screenshots.map((screenshot) => screenshot.url) || []
}

export async function getGameBackgroundsByName(name: string): Promise<string[]> {
  const fields = ['titles{title}', 'screenshots{url}']

  interface VNWithScreenshotsAndTitles extends VNWithScreenshots {
    titles: VNTitle[]
  }

  const data = await fetchVNDB<VNWithScreenshotsAndTitles>({
    filters: ['search', '=', name],
    fields,
    sort: VNDB_SEARCH_SORT
  })

  if (data.results.length > 0) {
    let vn = data.results.find((result) =>
      result.titles.some((titleJson) => titleJson.title.toLowerCase() === name.toLowerCase())
    )
    vn = vn || data.results[0]

    return vn.screenshots.map((screenshot) => screenshot.url)
  }
  return []
}

export async function getGameCover(vnId: string): Promise<string> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`
  const fields = ['image{url}']

  const data = await fetchVNDB<VNWithCover>({
    filters: ['id', '=', formattedId],
    fields,
    results: 1
  })

  return data.results[0]?.image?.url || ''
}

export async function getGameCoverByName(name: string): Promise<string> {
  const fields = ['image{url}']

  const data = await fetchVNDB<VNWithCover>({
    filters: ['search', '=', name],
    fields,
    sort: VNDB_SEARCH_SORT,
    results: 1
  })

  return data.results[0]?.image?.url || ''
}

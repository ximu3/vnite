import { VNDBField, VNDBResponse } from './types'
import { GameList, GameMetadata } from '../types'
import { formatDescription } from './parser'

async function fetchVNDB<T extends readonly VNDBField[]>(params: {
  filters: Array<unknown>
  fields: T
  results?: number
}): Promise<VNDBResponse<T>> {
  const response = await fetch('https://api.vndb.org/kana/vn', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...params,
      fields: params.fields.join(',')
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function searchVNDBGames(gameName: string): Promise<GameList> {
  const fields = ['titles{main,title}', 'released', 'developers{name}', 'id'] as const

  try {
    const data = await fetchVNDB({
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
    'titles{main,title}',
    'released',
    'description',
    'developers{name}',
    'tags{rating,name}',
    'extlinks{label,url}'
  ] as const

  try {
    const data = await fetchVNDB({
      filters: ['id', '=', formattedId],
      fields
    })

    if (!data.results.length) {
      throw new Error(`No visual novel found with ID: ${vnId}`)
    }

    const vn = data.results[0]

    return {
      name: vn.titles.find((t) => t.main)?.title || vn.titles[0].title,
      originalName: vn.titles.find((t) => t.main)?.title || vn.titles[0].title,
      releaseDate: vn.released || '',
      description: formatDescription(vn.description),
      developers: vn.developers?.map((d) => d.name) || [''],
      relatedSites: vn.extlinks?.map((link) => ({ label: link.label, url: link.url })) || [],
      tags:
        vn.tags
          ?.sort((a, b) => b.rating - a.rating)
          .slice(0, 10)
          .map((tag) => tag.name) ?? []
    }
  } catch (error) {
    console.error(`Error fetching metadata for VN ${vnId}:`, error)
    throw error
  }
}

export async function checkVNExists(vnId: string): Promise<boolean> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`

  const fields = ['title'] as const

  try {
    const data = await fetchVNDB({
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

export async function getGameScreenshots(vnId: string): Promise<string[]> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`

  const fields = ['screenshots{url}'] as const

  try {
    const data = await fetchVNDB({
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

export async function getGameScreenshotsByTitle(title: string): Promise<string[]> {
  const fields = ['titles{title}', 'screenshots{url}'] as const

  try {
    const data = await fetchVNDB({
      filters: ['search', '=', title],
      fields
    })
    if (data.results.length > 0) {
      let vn = data.results.find((result) =>
        result.titles.some((titleJson) => titleJson.title.toLowerCase() === title.toLowerCase())
      )
      vn = vn || data.results[0]
      return vn.screenshots.map((screenshot) => screenshot.url)
    }
    return []
  } catch (error) {
    console.error(`Error fetching images for VN ${title}:`, error)
    return []
  }
}

export async function getGameCover(vnId: string): Promise<string> {
  const formattedId = vnId.startsWith('v') ? vnId : `v${vnId}`

  const fields = ['image{url}'] as const

  try {
    const data = (await fetchVNDB({
      filters: ['id', '=', formattedId],
      fields,
      results: 1
    })) as any

    return data.results[0].image.url
  } catch (error) {
    console.error(`Error fetching cover for VN ${vnId}:`, error)
    return ''
  }
}

export async function getGameCoverByTitle(title: string): Promise<string> {
  const fields = ['image{url}'] as const

  try {
    const data = (await fetchVNDB({
      filters: ['search', '=', title],
      fields,
      results: 1
    })) as any

    return data.results[0].image.url
  } catch (error) {
    console.error(`Error fetching cover for VN ${title}:`, error)
    return ''
  }
}

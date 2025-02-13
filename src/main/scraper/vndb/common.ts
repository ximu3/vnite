import { VNDBField, VNDBResponse } from './types'
import { GameList, GameMetadata } from '../types'
import { formatDescription } from './parser'

async function fetchVNDB<T extends readonly VNDBField[]>(params: {
  filters: Array<unknown>
  fields: T
  results?: number
}): Promise<VNDBResponse<T>> {
  const endpoints = ['https://api.vndb.org/kana/vn', 'https://api.ximu.dev/vndb/kana/vn']
  const TIMEOUT_MS = 5000

  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...params,
      fields: params.fields.join(',')
    })
  }

  let lastError: Error | null = null

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const response = await fetch(endpoint, {
        ...requestConfig,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      lastError = error as Error
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (errorMessage.includes('abort')) {
        console.warn(`Timeout exceeded (${TIMEOUT_MS}ms) for ${endpoint}`)
      } else {
        console.warn(`Failed to fetch from ${endpoint}:`, error)
      }

      continue
    }
  }

  throw new Error(`All endpoints failed. Last error: ${lastError?.message}`)
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
      relatedSites: [
        ...(vn.extlinks?.map((link) => ({ label: link.label, url: link.url })) || []),
        { label: 'VNDB', url: `https://vndb.org/${vnId}` }
      ],
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

// helper function: replace image domain name
function getAlternativeImageUrl(originalUrl: string): string {
  return originalUrl.replace('https://t.vndb.org/', 'https://api.ximu.dev/vndb/img/')
}

// helper function: try to get the image
async function tryFetchImage(url: string): Promise<string> {
  const TIMEOUT_MS = 5000

  async function fetchWithTimeout(fetchUrl: string): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(fetchUrl, {
        method: 'HEAD',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  try {
    const response = await fetchWithTimeout(url)
    if (response.ok) {
      return url
    }
    throw new Error(`Failed to fetch image: ${response.status}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('abort')) {
      console.warn(`Image fetch timeout (${TIMEOUT_MS}ms) for URL: ${url}`)
    } else {
      console.warn(`Failed to fetch image from primary URL: ${url}`, error)
    }

    const alternativeUrl = getAlternativeImageUrl(url)
    console.warn(`Retrying with alternative URL: ${alternativeUrl}`)

    try {
      const alternativeResponse = await fetchWithTimeout(alternativeUrl)
      if (alternativeResponse.ok) {
        return alternativeUrl
      }
    } catch (altError) {
      console.warn(`Alternative URL also failed: ${alternativeUrl}`, altError)
    }

    return alternativeUrl
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

    // Process all screenshot URLs
    const urls = data.results[0].screenshots.map((screenshot) => screenshot.url)
    return await Promise.all(urls.map((url) => tryFetchImage(url)))
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

      // Process all screenshot URLs
      const urls = vn.screenshots.map((screenshot) => screenshot.url)
      return await Promise.all(urls.map((url) => tryFetchImage(url)))
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

    return await tryFetchImage(data.results[0].image.url)
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

    return await tryFetchImage(data.results[0].image.url)
  } catch (error) {
    console.error(`Error fetching cover for VN ${title}:`, error)
    return ''
  }
}

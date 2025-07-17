import { net } from 'electron'
import { GameList, GameMetadata } from '@appTypes/utils'
import { getLanguage } from '~/features/system/services/i18n'
import { extractReleaseDateWithLibrary } from './i18n'
import i18next from 'i18next'

// Note: Cheerio is not available in the Electron main process
// Using regex-based HTML parsing instead

export async function searchDlsiteGames(gameName: string): Promise<GameList> {
  const encodedQuery = encodeURIComponent(gameName.trim()).replace(/%20/g, '+')
  const url = `https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/${encodedQuery}/`

  const language = await getLanguage()

  const response = await net.fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${language}`
    }
  })

  const data = await response.text()
  const results: GameList = []

  // Parse search results using regex
  const searchResultRegex =
    /<div[^>]*class="[^"]*search_result_img_box_inner[^"]*"[^>]*>(.*?)<\/div>/gs
  const searchResults = data.match(searchResultRegex) || []

  for (const resultHtml of searchResults) {
    // Extract product ID
    const idMatch = resultHtml.match(/id="([^"]*_link_[^"]*)"/)
    const id = idMatch?.[1]?.replace('_link_', '') || ''

    // Extract game name
    const nameMatch = resultHtml.match(/<a[^>]*class="[^"]*work_name[^"]*"[^>]*>(.*?)<\/a>/s)
    const name = nameMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || ''

    // Extract developer (producer)
    const developerMatch = resultHtml.match(/<a[^>]*class="[^"]*maker_name[^"]*"[^>]*>(.*?)<\/a>/s)
    const developer = developerMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || ''
    const developers = developer ? [developer] : []

    if (name) {
      results.push({
        id,
        name,
        releaseDate: '',
        developers
      })
    }
  }

  console.log(`Search for "${gameName}" found ${results.length} results`)
  return results
}

export async function getDlsiteMetadata(dlsiteId: string): Promise<GameMetadata> {
  // Try to access the work page
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()

  const response = await net.fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${language}`
    }
  })

  const data = await response.text()

  // Extract basic information using regex
  const nameMatch = data.match(/<[^>]*id="work_name"[^>]*>(.*?)<\/[^>]*>/s)
  const name = nameMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || ''

  const workTypeTerm = i18next.t('scraper:dlsite.workType', { lng: language })
  const releaseDateTerm = i18next.t('scraper:dlsite.releaseDate', { lng: language })
  const seriesTerm = i18next.t('scraper:dlsite.series', { lng: language })

  // Extract description
  let description = ''
  const descMatch = data.match(/<div[^>]*itemprop="description"[^>]*>(.*?)<\/div>/s)
  if (descMatch) {
    // Clean up HTML tags and format
    description = descMatch[1]
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Extract release date
  let releaseDate = ''
  const releaseDateRegex = new RegExp(`${releaseDateTerm}[^<]*?([^<]+)`, 'i')
  const releaseDateMatch = data.match(releaseDateRegex)
  if (releaseDateMatch) {
    releaseDate = extractReleaseDateWithLibrary(releaseDateMatch[1], language)
  }

  // Extract developer (producer)
  const developerMatch = data.match(
    /<[^>]*class="[^"]*maker_name[^"]*"[^>]*>.*?<a[^>]*>(.*?)<\/a>/s
  )
  const developer = developerMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || ''
  const developers = developer ? [developer] : []
  const publishers = developers.length > 0 ? [...developers] : undefined

  // Extract tags and genres
  const tags: string[] = []
  const genres: string[] = []

  // Extract main genre tags
  const genreMatches =
    data.match(/<[^>]*class="[^"]*main_genre[^"]*"[^>]*>.*?<a[^>]*>(.*?)<\/a>/gs) || []
  for (const match of genreMatches) {
    const tagMatch = match.match(/<a[^>]*>(.*?)<\/a>/s)
    if (tagMatch) {
      const tag = tagMatch[1].replace(/<[^>]*>/g, '').trim()
      if (tag && !tags.includes(tag)) {
        tags.push(tag)
      }
    }
  }

  // Extract work type
  const workTypeRegex = new RegExp(`${workTypeTerm}[^<]*?<a[^>]*>(.*?)</a>`, 'gs')
  let workTypeMatch
  while ((workTypeMatch = workTypeRegex.exec(data)) !== null) {
    const genre = workTypeMatch[1].replace(/<[^>]*>/g, '').trim()
    if (genre && !genres.includes(genre)) {
      genres.push(genre)
      if (!tags.includes(genre)) {
        tags.push(genre)
      }
    }
  }

  // Extract related sites
  const relatedSites: { label: string; url: string }[] = []

  // Add producer site
  const makerUrlMatch = data.match(
    /<[^>]*class="[^"]*maker_name[^"]*"[^>]*>.*?<a[^>]*href="([^"]*)"/
  )
  if (makerUrlMatch?.[1] && developer) {
    relatedSites.push({
      label: `${developer} (${i18next.t('scraper:dlsite.maker', { lng: language })})`,
      url: makerUrlMatch[1]
    })
  }

  // Add series link (if exists)
  const seriesRegex = new RegExp(`${seriesTerm}[^<]*?<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>`, 'i')
  const seriesMatch = data.match(seriesRegex)
  if (seriesMatch) {
    const seriesUrl = seriesMatch[1]
    const seriesName = seriesMatch[2].replace(/<[^>]*>/g, '').trim()
    if (seriesUrl && seriesName) {
      relatedSites.push({
        label: `${seriesName} (${i18next.t('scraper:dlsite.series', { lng: language })})`,
        url: seriesUrl
      })
    }
  }

  const originalName = name

  return {
    name,
    originalName,
    releaseDate,
    description,
    developers,
    publishers,
    genres: genres.length > 0 ? genres : undefined,
    relatedSites,
    tags
  }
}

export async function getDlsiteMetadataByName(gameName: string): Promise<GameMetadata> {
  try {
    const gameList = await searchDlsiteGames(gameName)

    if (gameList.length === 0) {
      return {
        name: gameName,
        originalName: gameName,
        releaseDate: '',
        description: '',
        developers: [],
        relatedSites: [],
        tags: []
      }
    }

    // Use the first match
    const firstMatch = gameList[0]
    return getDlsiteMetadata(firstMatch.id)
  } catch (error) {
    console.error(`Error fetching metadata for game ${gameName}:`, error)
    throw error
  }
}

export async function getGameBackgrounds(dlsiteId: string): Promise<string[]> {
  try {
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
    const language = await getLanguage()

    const response = await net.fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=${language}`
      }
    })

    const data = await response.text()
    const screenshots: string[] = []

    // Extract all sample images using regex
    const imageRegex = /<div[^>]*data-src="([^"]*)"[^>]*>/g
    let match
    while ((match = imageRegex.exec(data)) !== null) {
      let imgUrl = match[1]

      if (imgUrl) {
        // Fix protocol relative URLs
        if (imgUrl.startsWith('//')) {
          imgUrl = `https:${imgUrl}`
        }

        // Avoid duplicate URLs
        if (!screenshots.includes(imgUrl)) {
          screenshots.push(imgUrl)
        }
      }
    }

    return screenshots
  } catch (error) {
    console.error(`Error fetching game backgrounds for work ${dlsiteId}:`, error)
    return []
  }
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  try {
    // First search to get ID
    const gameList = await searchDlsiteGames(gameName)

    if (gameList.length === 0) {
      return []
    }

    // Use the first match
    const firstMatch = gameList[0]
    return getGameBackgrounds(firstMatch.id)
  } catch (error) {
    console.error(`Error fetching game backgrounds for game ${gameName}:`, error)
    return []
  }
}

export async function getGameCover(dlsiteId: string): Promise<string> {
  try {
    const screenshots = await getGameBackgrounds(dlsiteId)

    // Usually the first image is the cover
    if (screenshots.length > 0) {
      return screenshots[0]
    }

    // If no sample image is found, try to get main image from work page
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
    const language = await getLanguage()

    const response = await net.fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=${language}`
      }
    })

    const data = await response.text()

    // Extract main image using regex
    const mainImgMatch = data.match(/<img[^>]*class="[^"]*product-slider[^"]*"[^>]*src="([^"]*)"/)
    if (mainImgMatch) {
      let mainImg = mainImgMatch[1]
      // Fix protocol relative URLs
      if (mainImg.startsWith('//')) {
        mainImg = `https:${mainImg}`
      }
      return mainImg
    }

    return ''
  } catch (error) {
    console.error(`Error fetching cover image for work ${dlsiteId}:`, error)
    return ''
  }
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  try {
    // First search to get ID
    const gameList = await searchDlsiteGames(gameName)

    if (gameList.length === 0) {
      return ''
    }

    // Use the first match
    const firstMatch = gameList[0]
    return getGameCover(firstMatch.id)
  } catch (error) {
    console.error(`Error fetching cover image for work ${gameName}:`, error)
    return ''
  }
}

export async function checkGameExists(dlsiteId: string): Promise<boolean> {
  try {
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`

    const response = await net.fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=ja`
      }
    })

    // If the page loads successfully and doesn't contain error messages, the work is considered to exist
    const data = await response.text()
    return (
      response.ok &&
      !data.includes('該当作品はございません') &&
      !data.includes('作品は存在しません')
    )
  } catch (_error) {
    // Request failed, possibly with a 404 or other error
    return false
  }
}

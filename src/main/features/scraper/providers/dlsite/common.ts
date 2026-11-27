import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import * as cheerio from 'cheerio'
import i18next from 'i18next'
import { ConfigDBManager } from '~/core/database'
import { isHttpError, logScraperError } from '../../errors'
import { createScraperFetch, readScraperJson } from '../../request'
import { extractReleaseDateWithLibrary } from './i18n'
import { DLsiteRatingResponse } from './types'

const fetch = createScraperFetch()

const ID_REGEX = /(rj|re|vj)\d{4,}/gi

function buildDlsiteWorkUrl(dlsiteId: string, locale?: string): string {
  const localePart = locale ? `?locale=${locale}` : ''
  if (dlsiteId.startsWith('VJ')) {
    return `https://www.dlsite.com/pro/work/=/product_id/${dlsiteId}.html${localePart}`
  }
  return `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html${localePart}`
}

function extractBackgroundUrls($: cheerio.CheerioAPI): string[] {
  const backgrounds = $('.key-visual-slider picture img[src]')
    .map((_, element) => $(element).attr('src'))
    .get()
    .map((url) => (url.startsWith('//') ? `https:${url}` : url))

  return [...new Set(backgrounds)]
}

export async function searchDlsiteGames(gameName: string, gamePath?: string): Promise<GameList> {
  const findIdInName = await ConfigDBManager.getConfigValue('game.scraper.dlsite.findIdInName')
  if (findIdInName) {
    // Check if the game name contains a id pattern like "RJ123456"
    const matchSource = typeof gamePath !== 'undefined' && gamePath ? gamePath : gameName
    const matchIds = [...matchSource.matchAll(ID_REGEX)]
    // Return the first sucessfully fetched result
    for (let i = 0; i < matchIds.length; i++) {
      const dlsiteId = matchIds[i][0].toUpperCase()
      try {
        const gameMetadata = await getDlsiteMetadata(dlsiteId)
        if (gameMetadata?.name && gameMetadata.name.length > 0) {
          const result: GameList = [
            {
              id: dlsiteId,
              name: gameMetadata.name,
              releaseDate: gameMetadata.releaseDate,
              developers: gameMetadata.developers
            }
          ]
          return result
        }
      } catch (error) {
        logScraperError(error, 'DLsite', 'extracted ID fallback', 'warn')
      }
    }
  }
  const encodedQuery = encodeURIComponent(gameName.trim()).replace(/%20/g, '+')
  const locale = i18next.t('scraper:dlsite.locale')
  // Restrict keyword searches to games to avoid matching other work categories.
  const url = `https://www.dlsite.com/maniax/fsr/=/language/jp/work_type_category%5B0%5D/game/keyword/${encodedQuery}/?locale=${locale}`

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${locale}`
    }
  })

  const data = await response.text()
  const $ = cheerio.load(data)
  const results: GameList = []

  $('.search_result_img_box_inner').each((_, element) => {
    // Get ID from data-list_item_product_id attribute
    let id = $(element).attr('data-list_item_product_id') || ''

    // If ID is not found, try to extract it from the link URL
    if (!id) {
      const href = $(element).find('a.work_thumb_inner').attr('href') || ''
      const productIdMatch = href.match(/product_id\/([^.]+)\.html/)
      id = productIdMatch ? productIdMatch[1] : ''
    }

    // Get game name
    const nameElement = $(element).find('.work_name a')
    const name = nameElement.attr('title') || nameElement.text().trim()

    // Get developer
    const developer = $(element).find('.maker_name a').text().trim()
    const developers = developer ? [developer] : []

    if (name && id) {
      results.push({
        id,
        name,
        releaseDate: '',
        developers
      })
    }
  })

  console.log(`Search for "${gameName}" found ${results.length} results`)
  return results
}

export async function getDlsiteScore(identifier: ScraperIdentifier): Promise<number | null> {
  const gameId =
    identifier.type === 'id'
      ? identifier.value.trim().toUpperCase()
      : (await searchDlsiteGames(identifier.value))[0]?.id
  if (!gameId) return null

  const section = gameId.startsWith('VJ') ? 'pro' : 'maniax'
  const url = new URL(`https://www.dlsite.com/${section}/product/info/ajax`)
  url.searchParams.set('product_id', gameId)

  try {
    const response = await fetch(url.toString())
    const data = await readScraperJson<DLsiteRatingResponse>(response)
    const rating = data[gameId]
    if (!rating || !(rating.rate_count > 0)) return null
    const score = rating.rate_average_2dp ?? rating.rate_average
    return typeof score === 'number' ? score * 2 : null
  } catch (error) {
    if (isHttpError(error, 404)) return null
    throw error
  }
}

export async function getDlsiteMetadata(dlsiteId: string): Promise<GameMetadata | null> {
  // Try to access the work page
  const locale = i18next.t('scraper:dlsite.locale')
  const url = buildDlsiteWorkUrl(dlsiteId, locale)

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=${locale}`
      }
    })
  } catch (error) {
    if (isHttpError(error, 404)) return null
    throw error
  }

  const data = await response.text()
  const $ = cheerio.load(data)

  // Extract basic information using Cheerio
  const name = $('#work_name').text().trim()
  const originalName = name

  const workTypeTerm = i18next.t('scraper:dlsite.workType')
  const releaseDateTerm = i18next.t('scraper:dlsite.releaseDate')
  const seriesTerm = i18next.t('scraper:dlsite.series')
  const infoKeys = $('dt.c-productInfo__key')
  const findInfoValues = (term: string): ReturnType<typeof infoKeys.next> =>
    infoKeys.filter((_, element) => $(element).text().trim().includes(term)).next('dd')

  // Extract description, keep HTML but modify links to add target="_blank"
  const descriptionElement = $(
    '.c-productInfo:not(.c-productSystemRequirements) > .c-productInfo__inner'
  ).first()

  // Find all links in the description element and add target="_blank" attribute
  descriptionElement.find('a').attr('target', '_blank')

  // Fix image and link URLs in the description, ensure URLs starting with // are converted to https://
  descriptionElement.find('img, a').each((_, element) => {
    const el = $(element)
    // Process img src attribute
    if (el.is('img')) {
      const src = el.attr('src')
      if (src && src.startsWith('//')) {
        el.attr('src', `https:${src}`)
      }
    }

    // Process link href attribute
    if (el.is('a')) {
      const href = el.attr('href')
      if (href && href.startsWith('//')) {
        el.attr('href', `https:${href}`)
      }
    }
  })

  // Remove all color styles
  descriptionElement.find('*').each((_, element) => {
    const el = $(element)
    // Remove color settings from style attribute
    const style = el.attr('style')
    if (style) {
      const newStyle = style
        .replace(/color\s*:\s*[^;]+;?/gi, '') // Remove color: xxx;
        .replace(/background-color\s*:\s*[^;]+;?/gi, '') // Remove background-color: xxx;
        .trim()

      if (newStyle) {
        el.attr('style', newStyle)
      } else {
        el.removeAttr('style')
      }
    }

    // Remove font color attribute
    el.removeAttr('color')
  })

  // Get the modified HTML
  let description = descriptionElement.html() || ''

  // Clean script and style tags
  description = description
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim()

  // Clear color attributes from font tags
  description = description
    .replace(/<font\s+color="[^"]*"([^>]*)>/gi, '<font$1>') // Remove <font color="xxx">
    .replace(/<font\s+color='[^']*'([^>]*)>/gi, '<font$1>') // Remove <font color='xxx'>
    .replace(/<span\s+style="color:\s*[^;"]*;?([^"]*)">/gi, '<span style="$1">') // Remove style="color: xxx;" but keep other styles
    .replace(/<span\s+style="background-color:\s*[^;"]*;?([^"]*)">/gi, '<span style="$1">') // Remove style="background-color: xxx;"
    .replace(/<span\s+style="([^"]*);?\s*color:\s*[^;"]*;?([^"]*)">/gi, '<span style="$1;$2">') // For cases when color is in the middle of style

  // Clean empty style attributes
  description = description.replace(/\sstyle="\s*"/gi, '').replace(/\sstyle='\s*'/gi, '')

  // Clean empty font tags, convert to span
  description = description
    .replace(/<font\s*>([^<]*)<\/font>/gi, '$1')
    .replace(/<font\s*([^>]*)>([^<]*)<\/font>/gi, '<span $1>$2</span>')

  // Clean whitespace between tags and consecutive whitespace
  description = description.replace(/>\s+</g, '><') // Clean whitespace between tags
  description = description.replace(/(\s)\s+/g, '$1') // Replace consecutive whitespace with a single space

  // Handle remaining URLs starting with // in the description (for possible inline styles or other attributes)
  description = description.replace(/(src|srcset|href)="\/\//g, '$1="https://')

  // Extract release date
  const releaseDateValue = findInfoValues(releaseDateTerm).first()
  const releaseDate = extractReleaseDateWithLibrary(
    releaseDateValue.text().trim(),
    releaseDateValue.find('a').attr('href')
  )

  // Extract developer (producer)
  const makerLink = $('a.c-productInfo__makerName')
  const developer = makerLink.text().trim()
  const developers = developer ? [developer] : []
  const publishers = developers.length > 0 ? [...developers] : undefined

  // Extract tags and genres
  const tags: string[] = []
  const genres: string[] = []

  // Extract main genre tags
  $('dd.c-productInfo__value a[href*="/genre/"]').each((_, element) => {
    const tag = $(element).text().trim()
    if (tag && !tags.includes(tag)) {
      tags.push(tag)
    }
  })

  // Extract work type
  findInfoValues(workTypeTerm)
    .find('a')
    .each((_, genreElement) => {
      const genre = $(genreElement).text().trim()
      if (genre && !genres.includes(genre)) {
        genres.push(genre)
        if (!tags.includes(genre)) {
          tags.push(genre)
        }
      }
    })

  // Extract related sites
  const relatedSites: { label: string; url: string }[] = []

  relatedSites.push({
    label: 'DLsite',
    url
  })

  // Add producer site
  // Electron's net.fetch does not reliably populate response.url.
  const makerUrl = makerLink.attr('href')
  if (makerUrl && developer) {
    relatedSites.push({
      label: `${developer} (${i18next.t('scraper:dlsite.maker')})`,
      url: new URL(makerUrl, url).href
    })
  }

  // Add series link (if exists)
  findInfoValues(seriesTerm).each((_, element) => {
    const seriesElement = $(element).find('a').first()
    const seriesUrl = seriesElement.attr('href')
    const seriesName = seriesElement.text().trim()
    if (seriesUrl && seriesName) {
      relatedSites.push({
        label: `${seriesName} (${i18next.t('scraper:dlsite.series')})`,
        url: new URL(seriesUrl, url).href
      })
    }
  })

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

export async function getDlsiteMetadataByName(gameName: string): Promise<GameMetadata | null> {
  const gameList = await searchDlsiteGames(gameName)

  if (gameList.length === 0) return null

  // Use the first match
  const firstMatch = gameList[0]
  return getDlsiteMetadata(firstMatch.id)
}

export async function getGameBackgrounds(dlsiteId: string): Promise<string[]> {
  try {
    const url = buildDlsiteWorkUrl(dlsiteId)
    const locale = i18next.t('scraper:dlsite.locale')

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=${locale}`
      }
    })

    const data = await response.text()
    const $ = cheerio.load(data)
    return extractBackgroundUrls($)
  } catch (error) {
    if (isHttpError(error, 404)) return []
    throw error
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
    if (isHttpError(error, 404)) return []
    throw error
  }
}

export async function getGameCover(dlsiteId: string): Promise<string> {
  try {
    const url = buildDlsiteWorkUrl(dlsiteId)
    const locale = i18next.t('scraper:dlsite.locale')

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=${locale}`
      }
    })

    const data = await response.text()
    const $ = cheerio.load(data)

    // First try to find an image containing img_main
    const mainImg = $('.c-keyVisual picture source[srcset*="_img_main"]').first().attr('srcset')

    // If an image containing img_main was found
    if (mainImg) {
      // Fix protocol-relative URL
      if (mainImg.startsWith('//')) {
        return `https:${mainImg}`
      }
      return mainImg
    }

    // If no image containing img_main was found, get the list of background images
    const screenshots = extractBackgroundUrls($)

    // Use the first background image as cover
    return screenshots[0] ?? ''
  } catch (error) {
    if (isHttpError(error, 404)) return ''
    throw error
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
    if (isHttpError(error, 404)) return ''
    throw error
  }
}

export async function checkGameExists(dlsiteId: string): Promise<boolean> {
  try {
    const url = buildDlsiteWorkUrl(dlsiteId)

    const response = await fetch(url, {
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
  } catch (error) {
    if (isHttpError(error, 404)) return false
    throw error
  }
}

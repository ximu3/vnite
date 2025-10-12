import { net } from 'electron'
import * as cheerio from 'cheerio'
import { GameList, GameMetadata } from '@appTypes/utils'
import { getLanguage } from '~/features/system/services/i18n'
import { extractReleaseDateWithLibrary } from './i18n'
import { ConfigDBManager } from '~/core/database'
import i18next from 'i18next'

const ID_REGEX = new RegExp('(rj|re|vj)\\d{4,}', 'i')

export async function searchDlsiteGames(gameName: string): Promise<GameList> {
  const findIdInName = await ConfigDBManager.getConfigValue('game.scraper.dlsite.findIdInName')
  if (findIdInName) {
    // Check if the game name contains a id pattern like "RJ123456"
    const dlsiteIds = ID_REGEX.exec(gameName)
    if (dlsiteIds && dlsiteIds.length > 0) {
      // Return the first sucessfully fetched result
      for (const key in dlsiteIds) {
        const dlsiteId = key.toUpperCase()
        try {
          const gameMetadata = await getDlsiteMetadata(dlsiteId)
          const result: GameList = [
            {
              id: dlsiteId,
              name: gameMetadata.name,
              releaseDate: gameMetadata.releaseDate,
              developers: gameMetadata.developers
            }
          ]
          return result
        } catch (error) {
          console.info(`Error fetching metadata for extracted ID ${dlsiteId}:`, error)
        }
      }
    }
  }
  const encodedQuery = encodeURIComponent(gameName.trim()).replace(/%20/g, '+')
  const language = await getLanguage()
  const url = `https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/${encodedQuery}/?locale=${language}`

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

export async function getDlsiteMetadata(dlsiteId: string): Promise<GameMetadata> {
  // Try to access the work page
  const language = await getLanguage()
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html?locale=${language}`

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
  const $ = cheerio.load(data)

  // Extract basic information using Cheerio
  const name = $('#work_name').text().trim()
  const originalName = name

  const workTypeTerm = i18next.t('scraper:dlsite.workType', { lng: language })
  const releaseDateTerm = i18next.t('scraper:dlsite.releaseDate', { lng: language })
  const seriesTerm = i18next.t('scraper:dlsite.series', { lng: language })

  // Extract description, keep HTML but modify links to add target="_blank"
  const descriptionElement = $('[itemprop="description"]')

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
  description = description.replace(/(src|href)="\/\//g, '$1="https://')

  // Extract release date
  let releaseDate = ''
  $('th').each((_, element) => {
    const thText = $(element).text().trim()
    if (thText.includes(releaseDateTerm)) {
      const releaseDateText = $(element).next('td').text().trim()
      releaseDate = extractReleaseDateWithLibrary(releaseDateText, language)
    }
  })

  // Extract developer (producer)
  const developer = $('.maker_name a').text().trim()
  const developers = developer ? [developer] : []
  const publishers = developers.length > 0 ? [...developers] : undefined

  // Extract tags and genres
  const tags: string[] = []
  const genres: string[] = []

  // Extract main genre tags
  $('.main_genre a').each((_, element) => {
    const tag = $(element).text().trim()
    if (tag && !tags.includes(tag)) {
      tags.push(tag)
    }
  })

  // Extract work type
  $('th').each((_, element) => {
    const thText = $(element).text().trim()
    if (thText.includes(workTypeTerm)) {
      $(element)
        .next('td')
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
    }
  })

  // Extract related sites
  const relatedSites: { label: string; url: string }[] = []

  relatedSites.push({
    label: 'DLsite',
    url
  })

  // Add producer site
  const makerUrl = $('.maker_name a').attr('href')
  if (makerUrl && developer) {
    relatedSites.push({
      label: `${developer} (${i18next.t('scraper:dlsite.maker', { lng: language })})`,
      url: makerUrl.startsWith('//') ? `https:${makerUrl}` : makerUrl
    })
  }

  // Add series link (if exists)
  $('th').each((_, element) => {
    const thText = $(element).text().trim()
    if (thText.includes(seriesTerm)) {
      const seriesElement = $(element).next('td').find('a').first()
      const seriesUrl = seriesElement.attr('href')
      const seriesName = seriesElement.text().trim()
      if (seriesUrl && seriesName) {
        relatedSites.push({
          label: `${seriesName} (${i18next.t('scraper:dlsite.series', { lng: language })})`,
          url: seriesUrl?.startsWith('//') ? `https:${seriesUrl}` : seriesUrl
        })
      }
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
    const $ = cheerio.load(data)
    const screenshots: string[] = []

    $('[data-src]').each((_, element) => {
      let imgUrl = $(element).attr('data-src') || ''

      if (imgUrl && imgUrl.startsWith('//')) {
        imgUrl = `https:${imgUrl}`
      }

      if (
        imgUrl &&
        !screenshots.includes(imgUrl) &&
        (imgUrl.includes('_img_main') || imgUrl.includes('_img_smp'))
      ) {
        screenshots.push(imgUrl)
      }
    })

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
    const $ = cheerio.load(data)

    // First try to find an image containing img_main
    let mainImg = ''

    // Search for all image elements
    $('img[srcset], source[srcset]').each((_, element) => {
      const srcset = $(element).attr('srcset') || ''
      if (srcset.includes('img_main') && !mainImg) {
        mainImg = srcset
      }
    })

    // If an image containing img_main was found
    if (mainImg) {
      // Fix protocol-relative URL
      if (mainImg.startsWith('//')) {
        return `https:${mainImg}`
      }
      return mainImg
    }

    // If no image containing img_main was found, get the list of background images
    const screenshots = await getGameBackgrounds(dlsiteId)

    // Use the first background image as cover
    if (screenshots.length > 0) {
      return screenshots[0]
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

import axios from 'axios'
import * as cheerio from 'cheerio'
import { GameList, GameMetadata } from '@appTypes/utils'
import { getLanguage } from '~/utils'
import { extractReleaseDateWithLibrary } from './i18n'
import i18next from 'i18next'

export async function searchDlsiteGames(gameName: string): Promise<GameList> {
  const encodedQuery = encodeURIComponent(gameName.trim()).replace(/%20/g, '+')
  const url = `https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/${encodedQuery}/`

  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)

  const $ = cheerio.load(response.data)
  const results: GameList = []

  $('.search_result_img_box_inner').each((_, elem) => {
    const $elem = $(elem)

    // Extract Product ID
    const idElement = $elem.find('.search_img.work_thumb')
    const id = idElement.attr('id')?.replace('_link_', '') || ''

    // Extract game name
    const name = $elem.find('.work_name a').text().trim()

    const releaseDate = ''

    // Extraction developer (producer)
    const developer = $elem.find('.maker_name a').text().trim()
    const developers = developer ? [developer] : []

    if (name) {
      results.push({
        id,
        name,
        releaseDate,
        developers
      })
    }
  })

  console.log(`Search for "${gameName}" found ${results.length} results`)

  return results
}

export async function getDlsiteMetadata(dlsiteId: string): Promise<GameMetadata> {
  // Try visiting the works page
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)
  const $ = cheerio.load(response.data)

  // Extract basic information
  const name = $('#work_name').text().trim()

  const workTypeTerm = i18next.t('scraper:dlsite.workType', { lng: language })
  const releaseDateTerm = i18next.t('scraper:dlsite.releaseDate', { lng: language })
  const seriesTerm = i18next.t('scraper:dlsite.series', { lng: language })

  // Extract full description
  let description = ''

  // Get description container
  const descriptionContainer = $('div[itemprop="description"]')

  if (descriptionContainer.length > 0) {
    // Dealing with the description of each section
    descriptionContainer.find('.work_parts').each((_, partElem) => {
      const $part = $(partElem)
      const heading = $part.find('.work_parts_heading').text().trim()

      // Handling the character picture section
      if ($part.hasClass('type_multiimages')) {
        description += heading && `【${heading}】\n`

        // Handling per-role projects
        $part.find('.work_parts_multiimage_item').each((_, charElem) => {
          const $char = $(charElem)
          const charName = $char.find('.text p').text().trim()

          // Get the image link and make sure it has a protocol header
          const imgLink = $char.find('a').attr('href')

          // Add a character name
          description += `${charName}\n`

          // Add an image label to the bottom of the character name
          if (imgLink) {
            // Make sure the URL has a protocol header
            const fullImgLink = imgLink.startsWith('//') ? `https:${imgLink}` : imgLink
            // Adding Image Elements
            description += `<img src="${fullImgLink}" alt="${charName}"
                        style="max-width: 50%;
                               height: auto;" />\n\n`
          }
        })
      } else {
        // Handling of plain text sections
        const content = $part.find('.work_parts_area').text().trim()
        if (content) {
          description += heading ? `【${heading}】\n${content}\n\n` : `${content}\n\n`
        }
      }
    })
  } else {
    // Alternate method
    description = $('#work_outline').text().trim()
  }

  // Clean up the description text
  description = description.replace(/\n{3,}/g, '\n\n').trim()

  let releaseDate = ''
  const saleDateRow = $(`#work_outline tr:contains("${releaseDateTerm}")`)

  if (saleDateRow.length > 0) {
    releaseDate = extractReleaseDateWithLibrary(saleDateRow.text(), language)
  }

  // Extraction developer (producer)
  const developer = $('#work_maker .maker_name a').text().trim()
  const developers = developer ? [developer] : []

  const publishers = developers.length > 0 ? [...developers] : undefined

  // Extract labels and types
  const tags: string[] = []
  const genres: string[] = []

  // Handling of work labels
  $('#work_outline .main_genre a').each((_, elem) => {
    const tag = $(elem).text().trim()
    tags.push(tag)
  })

  // Handling the type of work - using internationalized terminology
  $(`#work_outline tr:contains("${workTypeTerm}")`)
    .find('a')
    .each((_, elem) => {
      const genre = $(elem).text().trim()
      if (genre && !genres.includes(genre)) {
        genres.push(genre)

        // Also add tags
        if (!tags.includes(genre)) {
          tags.push(genre)
        }
      }
    })

  // Extract Related Sites
  const relatedSites: { label: string; url: string }[] = []

  // Add producer site
  const makerUrl = $('#work_maker .maker_name a').attr('href')
  if (makerUrl) {
    relatedSites.push({
      label: `${developer} (${i18next.t('scraper:dlsite.maker', { lng: language })})`,
      url: makerUrl
    })
  }

  // Add a link to the series (if it exists)
  const seriesElement = $(`#work_outline tr:contains("${seriesTerm}")`).find('a')
  if (seriesElement.length > 0) {
    const seriesName = seriesElement.text().trim()
    const seriesUrl = seriesElement.attr('href')
    if (seriesUrl) {
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
  // First search to get the ID
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
}

export async function getGameBackgrounds(dlsiteId: string): Promise<string[]> {
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)
  const $ = cheerio.load(response.data)

  const screenshots: string[] = []

  // Extract all sample images
  $('.product-slider-data div[data-src]').each((_, elem) => {
    let imgUrl = $(elem).attr('data-src')

    if (imgUrl) {
      // Fixing Protocol Relative URLs
      if (imgUrl.startsWith('//')) {
        imgUrl = `https:${imgUrl}`
      }

      // Avoid duplicate URLs
      if (!screenshots.includes(imgUrl)) {
        screenshots.push(imgUrl)
      }
    }
  })

  return screenshots
}

export async function getGameBackgroundsByName(gameName: string): Promise<string[]> {
  // First search to get the ID
  const gameList = await searchDlsiteGames(gameName)

  if (gameList.length === 0) {
    throw new Error(`No games named "${gameName}" were found.`)
  }

  // Use the first match
  const firstMatch = gameList[0]
  return getGameBackgrounds(firstMatch.id)
}

export async function getGameCover(dlsiteId: string): Promise<string> {
  const screenshots = await getGameBackgrounds(dlsiteId)

  // Usually the first image is the cover
  if (screenshots.length > 0) {
    return screenshots[0]
  }

  // If you don't find a sample image, try to get the main image from the work page
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)
  const $ = cheerio.load(response.data)

  let mainImg = $('#work_left .product-slider img').attr('src')
  if (mainImg) {
    // Fixing Protocol Relative URLs
    if (mainImg.startsWith('//')) {
      mainImg = `https:${mainImg}`
    }
    return mainImg
  }

  throw new Error(`Cannot find the cover image for the artwork ${dlsiteId}.`)
}

export async function getGameCoverByName(gameName: string): Promise<string> {
  // First search to get the ID
  const gameList = await searchDlsiteGames(gameName)

  if (gameList.length === 0) {
    throw new Error(`No games named "${gameName}" were found.`)
  }

  // Use the first match
  const firstMatch = gameList[0]
  return getGameCover(firstMatch.id)
}

export async function checkGameExists(dlsiteId: string): Promise<boolean> {
  try {
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
    const client = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        Cookie: `adultchecked=1; locale=ja`
      }
    })
    const response = await client.get(url)

    // If the page loads successfully and does not contain an error message, the work is considered to exist
    return (
      response.status === 200 &&
      !response.data.includes('該当作品はございません') &&
      !response.data.includes('作品は存在しません')
    )
  } catch (_error) {
    // The request failed, possibly with a 404 or other error
    return false
  }
}

import { net } from 'electron'
import * as cheerio from 'cheerio'
import { GameList, GameMetadata } from '@appTypes/utils'
import { getLanguage } from '~/features/system/services/i18n'
import { extractReleaseDateWithLibrary } from './i18n'
import i18next from 'i18next'

export async function searchDlsiteGames(gameName: string): Promise<GameList> {
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
    // 从列表项的 data-list_item_product_id 属性获取ID
    let id = $(element).attr('data-list_item_product_id') || ''

    // 如果没有获取到ID，则尝试从链接URL中提取
    if (!id) {
      const href = $(element).find('a.work_thumb_inner').attr('href') || ''
      const productIdMatch = href.match(/product_id\/([^.]+)\.html/)
      id = productIdMatch ? productIdMatch[1] : ''
    }

    // 获取游戏名称
    const nameElement = $(element).find('.work_name a')
    const name = nameElement.attr('title') || nameElement.text().trim()

    // 获取开发者
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

  // 提取描述，保留HTML，但修改链接以添加target="_blank"
  const descriptionElement = $('[itemprop="description"]')

  // 查找描述元素中的所有链接，并添加target="_blank"属性
  descriptionElement.find('a').attr('target', '_blank')

  // 修正描述中的图片和链接URL，确保以 // 开头的URL转换为https://
  descriptionElement.find('img, a').each((_, element) => {
    const el = $(element)
    // 处理图片src属性
    if (el.is('img')) {
      const src = el.attr('src')
      if (src && src.startsWith('//')) {
        el.attr('src', `https:${src}`)
      }
    }

    // 处理链接href属性
    if (el.is('a')) {
      const href = el.attr('href')
      if (href && href.startsWith('//')) {
        el.attr('href', `https:${href}`)
      }
    }
  })

  // 移除所有颜色样式
  descriptionElement.find('*').each((_, element) => {
    const el = $(element)
    // 移除 style 属性中的颜色设置
    const style = el.attr('style')
    if (style) {
      const newStyle = style
        .replace(/color\s*:\s*[^;]+;?/gi, '') // 移除 color: xxx;
        .replace(/background-color\s*:\s*[^;]+;?/gi, '') // 移除 background-color: xxx;
        .trim()

      if (newStyle) {
        el.attr('style', newStyle)
      } else {
        el.removeAttr('style')
      }
    }

    // 移除字体颜色属性
    el.removeAttr('color')
  })

  // 获取修改后的HTML
  let description = descriptionElement.html() || ''

  // 清理脚本和样式标签
  description = description
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .trim()

  // 清除字体标签中的颜色属性
  description = description
    .replace(/<font\s+color="[^"]*"([^>]*)>/gi, '<font$1>') // 移除 <font color="xxx">
    .replace(/<font\s+color='[^']*'([^>]*)>/gi, '<font$1>') // 移除 <font color='xxx'>
    .replace(/<span\s+style="color:\s*[^;"]*;?([^"]*)">/gi, '<span style="$1">') // 移除 style="color: xxx;" 但保留其他样式
    .replace(/<span\s+style="background-color:\s*[^;"]*;?([^"]*)">/gi, '<span style="$1">') // 移除 style="background-color: xxx;"
    .replace(/<span\s+style="([^"]*);?\s*color:\s*[^;"]*;?([^"]*)">/gi, '<span style="$1;$2">') // 在样式中间的情况

  // 清理空的 style 属性
  description = description.replace(/\sstyle="\s*"/gi, '').replace(/\sstyle='\s*'/gi, '')

  // 清理空的 font 标签，转换为 span
  description = description
    .replace(/<font\s*>([^<]*)<\/font>/gi, '$1')
    .replace(/<font\s*([^>]*)>([^<]*)<\/font>/gi, '<span $1>$2</span>')

  // 清除标签之间的空白和连续空白
  description = description.replace(/>\s+</g, '><') // 清除标签之间的空白
  description = description.replace(/(\s)\s+/g, '$1') // 将连续空白替换为单个空白

  // 处理描述中剩余的以 // 开头的URL（针对可能的内联样式或其他属性）
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

    // 首先尝试找到包含 img_main 的图片
    let mainImg = ''

    // 查找所有图片元素
    $('img[srcset], source[srcset]').each((_, element) => {
      const srcset = $(element).attr('srcset') || ''
      if (srcset.includes('img_main') && !mainImg) {
        mainImg = srcset
      }
    })

    // 如果找到了包含 img_main 的图片
    if (mainImg) {
      // 修复协议相对URL
      if (mainImg.startsWith('//')) {
        return `https:${mainImg}`
      }
      return mainImg
    }

    // 如果没有找到包含 img_main 的图片，则获取背景图片列表
    const screenshots = await getGameBackgrounds(dlsiteId)

    // 使用第一个背景图片作为封面
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

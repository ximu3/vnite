import axios from 'axios'
import * as cheerio from 'cheerio'
import { GameList, GameMetadata } from '@appTypes/utils'
import { getLanguage } from '~/utils'
import { getTerm, extractReleaseDateWithLibrary } from './i18n'

/**
 * 在DLsite上搜索游戏
 * @param gameName 游戏名称
 * @returns 游戏列表
 */
export async function searchDlsiteGames(gameName: string): Promise<GameList> {
  // 使用正确的域名和简化的URL参数
  const encodedQuery = encodeURIComponent(gameName.trim()).replace(/%20/g, '+')
  const url = `https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/${encodedQuery}/`

  // 添加更多请求头以模拟真实浏览器
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      // 以下 Cookie 是关键 - 参考 dlsite-async 库的实现
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)

  const $ = cheerio.load(response.data)
  const results: GameList = []

  // 适应搜索结果的正确HTML结构
  $('.search_result_img_box_inner').each((_, elem) => {
    const $elem = $(elem)

    // 提取产品ID - 匹配HTML中显示的ID格式
    const idElement = $elem.find('.search_img.work_thumb')
    const id = idElement.attr('id')?.replace('_link_', '') || ''

    // // 确保ID是RJ开头的有效格式
    // if (!id || !id.startsWith('RJ')) return

    // 提取游戏名称
    const name = $elem.find('.work_name a').text().trim()

    // 提取发行日期 - 在提供的HTML中没有明显看到，尝试从其他可能位置获取
    const releaseDate = ''

    // 提取开发者（制作方）
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

  // 调试信息
  console.log(`搜索"${gameName}"找到 ${results.length} 个结果`)

  return results
}

/**
 * 获取DLsite作品元数据
 * @param dlsiteId 作品ID（RJ号）
 * @returns 游戏元数据
 */
export async function getDlsiteMetadata(dlsiteId: string): Promise<GameMetadata> {
  // 尝试访问作品页面
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      // 以下 Cookie 是关键 - 参考 dlsite-async 库的实现
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)
  const $ = cheerio.load(response.data)

  // 提取基础信息
  const name = $('#work_name').text().trim()

  const workTypeTerm = getTerm('workType', language)
  const releaseDateTerm = getTerm('releaseDate', language)
  const seriesTerm = getTerm('series', language)

  // 提取完整描述
  let description = ''

  // 获取描述容器
  const descriptionContainer = $('div[itemprop="description"]')

  if (descriptionContainer.length > 0) {
    // 处理每个部分的描述
    descriptionContainer.find('.work_parts').each((_, partElem) => {
      const $part = $(partElem)
      const heading = $part.find('.work_parts_heading').text().trim()

      // 处理角色图片部分
      if ($part.hasClass('type_multiimages')) {
        description += heading && `【${heading}】\n`

        // 处理每个角色项目
        $part.find('.work_parts_multiimage_item').each((_, charElem) => {
          const $char = $(charElem)
          const charName = $char.find('.text p').text().trim()

          // 获取图片链接并确保有协议头
          const imgLink = $char.find('a').attr('href')

          // 添加角色名称
          description += `${charName}\n`

          // 添加图片标签到角色名称下方
          if (imgLink) {
            // 确保URL有协议头
            const fullImgLink = imgLink.startsWith('//') ? `https:${imgLink}` : imgLink
            // 添加图片元素
            description += `<img src="${fullImgLink}" alt="${charName}"
                        style="max-width: 50%;
                               height: auto;" />\n\n`
          }
        })
      } else {
        // 处理普通文本部分
        const content = $part.find('.work_parts_area').text().trim()
        if (content) {
          description += heading ? `【${heading}】\n${content}\n\n` : `${content}\n\n`
        }
      }
    })
  } else {
    // 备用方法
    description = $('#work_outline').text().trim()
  }

  // 清理描述文本
  description = description.replace(/\n{3,}/g, '\n\n').trim()

  // 提取发行日期
  let releaseDate = ''
  const saleDateRow = $(`#work_outline tr:contains("${releaseDateTerm}")`)

  if (saleDateRow.length > 0) {
    releaseDate = extractReleaseDateWithLibrary(saleDateRow.text(), language)
  }

  // 提取开发者（制作方）
  const developer = $('#work_maker .maker_name a').text().trim()
  const developers = developer ? [developer] : []

  // 可能存在的发行商（通常与开发者相同）
  const publishers = developers.length > 0 ? [...developers] : undefined

  // 提取标签和类型
  const tags: string[] = []
  const genres: string[] = []

  // 处理作品标签
  $('#work_outline .main_genre a').each((_, elem) => {
    const tag = $(elem).text().trim()
    tags.push(tag)
  })

  // 处理作品类型 - 使用国际化的术语
  $(`#work_outline tr:contains("${workTypeTerm}")`)
    .find('a')
    .each((_, elem) => {
      const genre = $(elem).text().trim()
      if (genre && !genres.includes(genre)) {
        genres.push(genre)

        // 同时加入标签
        if (!tags.includes(genre)) {
          tags.push(genre)
        }
      }
    })

  // 提取相关站点
  const relatedSites: { label: string; url: string }[] = []

  // 添加制作方站点
  const makerUrl = $('#work_maker .maker_name a').attr('href')
  if (makerUrl) {
    relatedSites.push({
      label: `${developer} (制作方)`,
      url: makerUrl
    })
  }

  // 添加系列链接（如果存在）
  const seriesElement = $(`#work_outline tr:contains("${seriesTerm}")`).find('a')
  if (seriesElement.length > 0) {
    const seriesName = seriesElement.text().trim()
    const seriesUrl = seriesElement.attr('href')
    if (seriesUrl) {
      relatedSites.push({
        label: `${seriesName} (${getTerm('series', language)})`,
        url: seriesUrl
      })
    }
  }

  // 处理原始名称（DLsite没有专门的原始名称字段，设为null）
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

/**
 * 从DLsite获取游戏截图
 * @param dlsiteId 作品ID（RJ号）
 * @returns 完整URL格式的截图数组
 */
export async function getGameScreenshots(dlsiteId: string): Promise<string[]> {
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      // 以下 Cookie 是关键 - 参考 dlsite-async 库的实现
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)
  const $ = cheerio.load(response.data)

  const screenshots: string[] = []

  // 提取所有样本图片
  $('.product-slider-data div[data-src]').each((_, elem) => {
    let imgUrl = $(elem).attr('data-src')

    if (imgUrl) {
      // 修复协议相对URL
      if (imgUrl.startsWith('//')) {
        imgUrl = `https:${imgUrl}`
      }

      // 避免重复URL
      if (!screenshots.includes(imgUrl)) {
        screenshots.push(imgUrl)
      }
    }
  })

  return screenshots
}

/**
 * 获取游戏封面
 * @param dlsiteId 作品ID（RJ号）
 * @returns 完整URL格式的封面图片
 */
export async function getGameCover(dlsiteId: string): Promise<string> {
  const screenshots = await getGameScreenshots(dlsiteId)

  // 通常第一张图片是封面
  if (screenshots.length > 0) {
    return screenshots[0]
  }

  // 如果没有找到样本图片，尝试从工作页面获取主图
  const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
  const language = await getLanguage()
  const client = axios.create({
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
      // 以下 Cookie 是关键 - 参考 dlsite-async 库的实现
      Cookie: `adultchecked=1; locale=${language}`
    }
  })
  const response = await client.get(url)
  const $ = cheerio.load(response.data)

  let mainImg = $('#work_left .product-slider img').attr('src')
  if (mainImg) {
    // 修复协议相对URL
    if (mainImg.startsWith('//')) {
      mainImg = `https:${mainImg}`
    }
    return mainImg
  }

  throw new Error(`无法找到作品 ${dlsiteId} 的封面图片`)
}

/**
 * 检查游戏是否存在
 * @param dlsiteId 作品ID（RJ号）
 * @returns 布尔值表示游戏是否存在
 */
export async function checkGameExists(dlsiteId: string): Promise<boolean> {
  try {
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${dlsiteId}.html`
    const language = await getLanguage()
    const client = axios.create({
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,ja;q=0.8,en;q=0.7',
        // 以下 Cookie 是关键 - 参考 dlsite-async 库的实现
        Cookie: `adultchecked=1; locale=${language}`
      }
    })
    const response = await client.get(url)

    // 如果页面加载成功且不包含错误消息，则认为作品存在
    return (
      response.status === 200 &&
      !response.data.includes('該当作品はございません') &&
      !response.data.includes('作品は存在しません')
    )
  } catch (_error) {
    // 请求失败，可能是404或其他错误
    return false
  }
}

/**
 * 通过标题获取游戏封面
 * @param gameName 游戏名称
 * @returns 封面图片URL
 */
export async function getGameCoverByTitle(gameName: string): Promise<string> {
  // 首先搜索获取ID
  const gameList = await searchDlsiteGames(gameName)

  if (gameList.length === 0) {
    throw new Error(`未找到名为 "${gameName}" 的游戏`)
  }

  // 使用第一个匹配结果
  const firstMatch = gameList[0]
  return getGameCover(firstMatch.id)
}

/**
 * 通过标题获取游戏截图
 * @param gameName 游戏名称
 * @returns 截图URL数组
 */
export async function getGameScreenshotsByTitle(gameName: string): Promise<string[]> {
  // 首先搜索获取ID
  const gameList = await searchDlsiteGames(gameName)

  if (gameList.length === 0) {
    throw new Error(`未找到名为 "${gameName}" 的游戏`)
  }

  // 使用第一个匹配结果
  const firstMatch = gameList[0]
  return getGameScreenshots(firstMatch.id)
}

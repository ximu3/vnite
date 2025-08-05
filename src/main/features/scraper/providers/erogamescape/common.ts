import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import * as cheerio from 'cheerio'
import { net } from 'electron'
import log from 'electron-log/main.js'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import { UnArray } from './types'
import { getchuProvider } from '../getchu'
import { vndbProvider } from '../vndb'

const esUrl = 'https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki'

async function fetchFromEs(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<[number, Readable]> {
  const url = new URL(`${esUrl}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })

  const response = await net.fetch(url.toString(), {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      Referer: esUrl,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
    }
  })
  const bodyReader = Readable.fromWeb(response.body as ReadableStream<Uint8Array>)
  return [response.status, bodyReader]
}

async function ensureEsId(identifier: ScraperIdentifier): Promise<string> {
  if (identifier.type === 'id') {
    return identifier.value
  }
  const gameList = await searchEsGames(identifier.value)
  if (gameList.length === 0) {
    return ''
  }
  return gameList[0].id
}

async function pipeToCheerio<T>(
  readable: Readable,
  func: (
    $: cheerio.CheerioAPI,
    resolve: (value: T | PromiseLike<T>) => void,
    reject: ((reason?: any) => void) | undefined,
    err: Error | null | undefined
  ) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const cheerioStream = cheerio.decodeStream({}, (err, $) => {
      if (err) {
        reject(err)
        return
      }
      func($, resolve, reject, err)
    })
    // Handle stream errors
    readable.on('error', reject)
    cheerioStream.on('error', reject)
    readable.pipe(cheerioStream)
  })
}

export async function searchEsGames(gameName: string): Promise<GameList> {
  const name = gameName.trim()
  if (name === '') {
    return []
  }
  const encodedGameName = name.replace(/\s+/g, ' ')
  const [status, bodyStream] = await fetchFromEs('/kensaku.php', {
    category: 'game',
    word_category: 'name',
    mode: 'normal',
    word: encodedGameName
  })
  if (status !== 200) {
    throw new Error(`HTTP error! status: ${status}`)
  }
  return pipeToCheerio(bodyStream, ($, resolve) => {
    const result: GameList = []
    // retrieves all table rows
    const rows = $('#result tr')
    // if length less than 2 (not found), resolves immediately
    if (rows.length < 2) {
      resolve(result)
    }
    const positionMap = {
      name: 0,
      brand: 1,
      releaseDate: 2
    }
    rows.each((idx, el) => {
      const row = $(el)
      if (idx === 0) {
        // the first row will always be header
        row.find('th').each((cidx, cel) => {
          switch ($(cel).text()) {
            case 'ゲーム名':
              positionMap.name = cidx
              break
            case 'ブランド名':
              positionMap.brand = cidx
              break
            case '発売日':
              positionMap.releaseDate = cidx
              break
            default:
              break
          }
        })
      } else {
        // name, id
        const nameAnchor = row.find(`td:nth(${positionMap.name}) > a:first`)
        const name = nameAnchor.text()
        // some games contain extra information in their names (such as platforms)
        const nameExtra = row.find(`td:nth(${positionMap.name}) > span:first`).text()
        const id =
          nameAnchor
            .attr('href')
            ?.match(/game\.php\?game=(\d+)#ad$/)
            ?.at(1) ?? ''
        // developer
        const brandAnchor = row.find(`td:nth(${positionMap.brand}) > a`)
        const developer = brandAnchor.text()
        // release date
        const releaseDate = row.find(`td:nth(${positionMap.releaseDate})`).text()
        result.push({
          id,
          name: name + nameExtra,
          releaseDate,
          developers: [developer]
        })
      }
    })
    resolve(result)
  })
}

export async function checkEsGameExists(gameId: string): Promise<boolean> {
  const [status] = await fetchFromEs('/game.php', { game: gameId })
  if (status === 200) {
    return true
  }
  if (status === 404) {
    return false
  }
  log.error(`Error checking game existence for ID ${gameId}: HTTP status: ${status}`)
  return false
}

export async function getEsGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
  const id = await ensureEsId(identifier)
  if (id === '') {
    return {
      name: identifier.value,
      originalName: identifier.value,
      releaseDate: '',
      description: '',
      developers: [],
      relatedSites: [],
      tags: [],
      extra: []
    }
  }
  const [status, bodyStream] = await fetchFromEs('/game.php', {
    game: id
  })
  if (status !== 200) {
    throw new Error(`HTTP error! status: ${status}`)
  }
  return pipeToCheerio(bodyStream, async ($, resolve) => {
    // name
    const name = $('div#soft-title > span.bold:first').text()
    // brand
    const brand = $('tr#brand > td:first').text()
    // release date
    const releaseDate = $('tr#sellday > td:first').text()
    // related sites
    const officialSite = $('#game_title > a:first').attr('href')
    const relatedSites: GameMetadata['relatedSites'] = []
    if (officialSite) {
      relatedSites.push({ label: 'Official Site', url: officialSite })
    }
    relatedSites.push({ label: 'ErogameScape', url: `${esUrl}/game.php?game=${id}` })
    // illustrators
    const exIllustration: Required<UnArray<GameMetadata['extra']>> = {
      key: 'illustration', // change to support i18n extra key
      value: []
    }
    $('tr#kyaradeza > td > a').each((_, el) => {
      exIllustration.value.push($(el).text())
    })
    $('tr#genga > td > a').each((_, el) => {
      exIllustration.value.push($(el).text())
    })
    // scenario writers
    const exScenario: Required<UnArray<GameMetadata['extra']>> = {
      key: 'scenario', // change to support i18n extra key
      value: []
    }
    $('tr#shinario > td > a').each((_, el) => {
      exScenario.value.push($(el).text())
    })
    // composers
    const exMusic: Required<UnArray<GameMetadata['extra']>> = {
      key: 'music', // change to support i18n extra key
      value: []
    }
    $('tr#ongaku > td > a').each((_, el) => {
      exMusic.value.push($(el).text())
    })
    // CV
    const exCv: Required<UnArray<GameMetadata['extra']>> = {
      key: 'voice', // change to support i18n extra key
      value: []
    }
    $('tr#seiyu > td > a').each((_, el) => {
      exCv.value.push($(el).text())
    })

    const tags: string[] = []
    const genres: string[] = []
    const exBiases: Required<UnArray<GameMetadata['extra']>> = {
      key: 'Biases',
      value: []
    }
    const exCharacters: Required<UnArray<GameMetadata['extra']>> = {
      key: 'Character',
      value: []
    }
    // NSFW related stuffs
    const nsfwCell = $('tr#erogame > td:first').text()
    const nsfwText = nsfwCell.match(/(18禁|非18禁)/)?.at(1)
    if (nsfwText) {
      genres.push(nsfwText)
    }
    const nukigeText = nsfwCell.match(/(抜きゲー|非抜きゲー)/)?.at(1)
    if (nukigeText) {
      genres.push(nukigeText)
    }
    const biasText = nsfwCell.match(/(和姦もの|陵辱もの|どちらともいえない)/)?.at(1)
    if (biasText) {
      genres.push(biasText)
    }
    // pov table
    $('table#att_pov_table > tbody > tr').each((_, el) => {
      const header = $(el).find('th').text()
      switch (header) {
        case '公式ジャンル': // genres
          $(el)
            .find('td > a')
            .each((_, el) => {
              genres.push($(el).text())
            })
          break
        case 'ジャンル': // genres
          $(el)
            .find('td > a')
            .each((_, el) => {
              genres.push($(el).text())
            })
          break
        case 'タグ': // tags
          $(el)
            .find('td > a')
            .each((_, el) => {
              tags.push($(el).text())
            })
          break
        case 'シチュエーション': // tags
          $(el)
            .find('td > a')
            .each((_, el) => {
              tags.push($(el).text())
            })
          break
        case 'エロシーン': // tags
          $(el)
            .find('td > a')
            .each((_, el) => {
              tags.push($(el).text())
            })
          break
        case '傾向': // biases
          $(el)
            .find('td > a')
            .each((_, el) => {
              exBiases.value.push($(el).text())
            })
          break
        case '女の子キャラクター': // characters
          $(el)
            .find('td > a')
            .each((_, el) => {
              exCharacters.value.push($(el).text())
            })
          break
        default:
          break
      }
    })
    // platforms
    let platform = $('div#soft-title > span:nth(1)').text()
    if (platform && !platform.includes('18禁')) {
      platform = platform.substring(1, platform.length - 1)
    } else {
      platform = 'Windows'
    }
    // get description from getchu
    let description = ''
    if (getchuProvider.getGameMetadata) {
      const getchuMeta = await getchuProvider.getGameMetadata({ type: 'name', value: name })
      description = getchuMeta.description
    }
    resolve({
      name,
      originalName: name,
      releaseDate,
      description,
      developers: [brand],
      relatedSites: relatedSites,
      tags,
      genres,
      platforms: [platform],
      extra: [exIllustration, exScenario, exMusic, exCv, exBiases, exCharacters]
    })
  })
}

export async function getEsGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
  const id = await ensureEsId(identifier)
  if (id === '') {
    return []
  }
  let readable: Readable | null = null
  const fetchBackgroundOrSkip = async (path: string): Promise<void> => {
    if (readable) {
      return
    }
    const [status, bodyStream] = await fetchFromEs(path, {
      game: id
    })
    if (status === 200) {
      readable = bodyStream
    } else if (status !== 404) {
      throw new Error(`HTTP error! status: ${status}`)
    }
  }
  // fetching order: FANZA > DLSite > VNDB
  await fetchBackgroundOrSkip('/game_dmm.php')
  await fetchBackgroundOrSkip('/game_dlsite.php')
  if (!readable) {
    if (!vndbProvider.getGameBackgrounds) {
      return []
    }
    if (identifier.type === 'name') {
      return await vndbProvider.getGameBackgrounds(identifier)
    } else {
      const gameName = (await getEsGameMetadata(identifier)).name
      return await vndbProvider.getGameBackgrounds({ type: 'name', value: gameName })
    }
  }
  return pipeToCheerio(readable, ($, resolve) => {
    const images: string[] = []
    $('div#images img').each((_, el) => {
      const src = $(el).attr('src')
      if (src) {
        images.push(src)
      }
    })
    resolve(images)
  })
}

export async function getEsGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
  const id = await ensureEsId(identifier)
  if (id === '') {
    return []
  }
  const [status, bodyStream] = await fetchFromEs('/game.php', {
    game: id
  })
  if (status !== 200) {
    throw new Error(`HTTP error! status: ${status}`)
  }
  return pipeToCheerio(bodyStream, ($, resolve) => {
    const imgUrl = $('div#main_image img').attr('src')
    if (!imgUrl) {
      resolve([])
    }
    resolve([imgUrl!])
  })
}

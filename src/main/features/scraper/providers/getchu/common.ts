import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import * as cheerio from 'cheerio'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import Encoding from 'encoding-japanese'
import { text } from 'stream/consumers'
import { fetchProxy } from '../../utils/ScraperUtils'

const SCRAPER_ID = 'getchu'
const getchuUrl = 'https://www.getchu.com'

// preserves a piece of cache since getchu's search engine is super slow,
// and vnite appears to search the same game multiple times during a single add action
const searchCache = {
  encodedName: '',
  body: ''
}

async function fetchFromGetchu(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<[number, Readable]> {
  const url = new URL(`${getchuUrl}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })
  const response = await fetchProxy(SCRAPER_ID, url.toString(), {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      Referer: 'https://www.getchu.com/top.html',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Cookie: 'getchu_adalt_flag=getchu.com'
    }
  })
  const bodyReader = Readable.fromWeb(response.body as ReadableStream<Uint8Array>)
  return [response.status, bodyReader]
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

// getchu mixed up half-width and full-width punctions in game titles making searching
// more difficult, for that reason we simply remove punctions in game titles
function removePunctuations(input: string): string {
  const punctuationPattern =
    /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~！"＃＄％＆'（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～。、]/g
  return input.replace(punctuationPattern, ' ')
}

async function ensureGetchuId(identifier: ScraperIdentifier): Promise<string> {
  if (identifier.type === 'id') {
    return identifier.value
  }
  const gameList = await searchGetchuGames(identifier.value)
  if (gameList.length === 0) {
    return ''
  }
  return gameList[0].id
}

export async function searchGetchuGames(gameName: string): Promise<GameList> {
  const name = gameName.trim()
  if (name === '') {
    return []
  }
  const unicodeArray = Encoding.stringToCode(removePunctuations(name))
  const eucjpArray = Encoding.convert(unicodeArray, {
    to: 'EUCJP',
    from: 'UNICODE'
  })
  const encodedGameName = Encoding.urlEncode(eucjpArray)
  if (!searchCache.body || searchCache.encodedName !== encodedGameName) {
    const [status, bodyStream] = await fetchFromGetchu(
      `/php/search.phtml?search_title=${encodedGameName}&list_count=30&sort=title&sort2=down&genre=pc_soft&list_type=list&search=search`
    )
    if (status !== 200) {
      throw new Error(`HTTP error! status: ${status}`)
    }
    searchCache.body = await text(bodyStream)
    searchCache.encodedName = encodedGameName
  }

  const $ = cheerio.load(searchCache.body)
  const result: GameList = []
  const details = $('div#detail_block table > tbody')
  if (details.length === 0) {
    return result
  }
  details.each((_, el) => {
    const element = $(el).find('tr:first > td > a:first')
    const name = element.text()

    const id =
      element
        .attr('href')
        ?.match(/soft\.phtml\?id=(\d+)$/)
        ?.at(1) ?? ''
    const pElement = $(el).find('tr:nth(1) > td > p')
    const brand = pElement.find('a:first').text()
    const releaseDate =
      pElement
        .text()
        .match(/発売日：(\d{4}\/\d{2}\/\d{2})/)
        ?.at(1) ?? ''
    result.push({
      id,
      name,
      releaseDate,
      developers: [brand]
    })
  })
  return result
}

export async function checkGetchuGameExists(gameId: string): Promise<boolean> {
  const [status] = await fetchFromGetchu('/soft.phtml', { id: gameId })
  if (status === 200) {
    return true
  }
  if (status === 404) {
    return false
  }
  throw new Error(`Error checking game existence for ID ${gameId}: HTTP status: ${status}`)
}

export async function getGetchuGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
  const id = await ensureGetchuId(identifier)
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
  const [status, bodyStream] = await fetchFromGetchu('/soft.phtml', {
    id
  })
  if (status !== 200) {
    throw new Error(`HTTP error! status: ${status}`)
  }
  return pipeToCheerio(bodyStream, ($, resolve) => {
    // name
    const name = $('h1#soft-title').text().trim()
    // brand
    const brand = $('a#brandsite').text()
    // description
    const description = $('div.tabletitle.tabletitle_1 + div > span').text()

    const eucjpBytes = new Uint8Array(description.length)
    for (let i = 0; i < description.length; i++) {
      eucjpBytes[i] = description.charCodeAt(i)
    }
    const unicodeArray = Encoding.convert(eucjpBytes, {
      to: 'UNICODE',
      from: 'EUCJP'
    })
    const descriptionStr = Encoding.codeToString(unicodeArray).replace(/^\s+|\s+$/g, '')

    resolve({
      name: name,
      originalName: name,
      releaseDate: '',
      description: descriptionStr,
      developers: [brand],
      relatedSites: [],
      tags: []
    })
  })
}

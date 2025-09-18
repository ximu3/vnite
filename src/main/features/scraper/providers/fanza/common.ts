import { net } from 'electron'
import { Readable } from 'stream'
import { ReadableStream } from 'stream/web'
import * as cheerio from 'cheerio'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'

const fanzaUrl = 'https://dlsoft.dmm.co.jp'

function generateRandomFanzaId(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const chars: string[] = new Array(16)
  for (let i = 0; i < 14; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length)
    chars[i] = letters[randomIndex]
  }
  chars[14] = '_'
  chars[15] = '_'
  return chars.join('')
}

async function fetchFromFanza(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<[number, Readable]> {
  const url = new URL(`${fanzaUrl}${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value))
  })
  const guestId = generateRandomFanzaId()
  const response = await net.fetch(url.toString(), {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      Referer: 'https://dlsoft.dmm.co.jp/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      Cookie: `guest_id=${guestId}; ckcy=1; age_check_new_origin=1; age_check_done=1`
    }
  })
  const xxx = await response.text()
  console.log(xxx)
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

async function ensureFanzaId(identifier: ScraperIdentifier): Promise<string> {
  if (identifier.type === 'id') {
    return identifier.value
  }
  const gameList = await searchFanzaGames(identifier.value)
  if (gameList.length === 0) {
    return ''
  }
  return gameList[0].id
}

export async function searchFanzaGames(gameName: string): Promise<GameList> {
  const name = gameName.trim()
  if (name === '') {
    return []
  }
  const [status, bodyStream] = await fetchFromFanza('/search', {
    service: 'pcgame',
    searchstr: name
  })
  if (status !== 200) {
    throw new Error(`HTTP error! status: ${status}`)
  }
  return pipeToCheerio(bodyStream, ($, resolve) => {
    const result: GameList = []
    const items = $('ul.component-legacy-productTile > li.component-legacy-productTile__item')
    if (items.length === 0) {
      resolve(result)
    }
    items.each((_, el) => {
      const item = $(el)
      const anchor = item.find('a.component-legacy-productTile__detailLink')
      const id =
        anchor
          .attr('href')
          ?.match(/\/detail\/(\w+)\//)
          ?.at(1) ?? ''
      const title = anchor.find('span.component-legacy-productTile__title').text()
      result.push({
        id,
        name: title,
        releaseDate: '',
        developers: []
      })
    })
    resolve(result)
  })
}

export async function checkFanzaGameExists(gameId: string): Promise<boolean> {
  const [status] = await fetchFromFanza(`/detail/${gameId}`)
  if (status === 200) {
    return true
  }
  if (status === 404) {
    return false
  }
  throw new Error(`Error checking game existence for ID ${gameId}: HTTP status: ${status}`)
}

export async function getFanzaGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
  const id = await ensureFanzaId(identifier)
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
  const [status, bodyStream] = await fetchFromFanza(`/detail/${id}`)
  if (status !== 200) {
    throw new Error(`HTTP error! status: ${status}`)
  }
  return pipeToCheerio(bodyStream, ($, resolve) => {
    // name
    const name = $('h1.productTitle__item').text().trim()
    // brand
    const brand = $(
      'div.contentsDetailTop__table  div.contentsDetailTop__tableDataLeft:contains(ブランド) + div.contentsDetailTop__tableDataRight'
    ).text()
    // description
    const description = $('section.universalSection div.area-detail-read p').text()

    resolve({
      name: name,
      originalName: name,
      releaseDate: '',
      description: description,
      developers: [brand],
      relatedSites: [],
      tags: []
    })
  })
}

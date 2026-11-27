import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import log from 'electron-log/main'
import { ConfigDBManager, GameDBManager } from '~/core/database'

const DESCRIPTION_MEDIA_ATTRIBUTES = {
  img: 'src',
  video: 'poster'
} as const

function getUrlHash(url: string): string {
  return createHash('md5').update(url).digest('hex')
}

function extractDescriptionMediaUrls($: cheerio.CheerioAPI): Set<string> {
  const urls = new Set<string>()

  for (const [tagName, attribute] of Object.entries(DESCRIPTION_MEDIA_ATTRIBUTES)) {
    $(`${tagName}[${attribute}]`).each((_, element) => {
      const url = $(element).attr(attribute)
      if (!url || url.startsWith('data:')) return

      urls.add(url)
    })
  }

  return urls
}

/**
 * Use cached attachments in the description and replace cached pictures with their img element.
 * @param $ - parsed HTML description fragment
 * @param attachmentPrefix - URL prefix for this game's description attachments
 * @param cachedUrlHashes - mapping of available cached media URLs to their hashes
 * @returns description with cached attachment URLs
 */
function replaceDescriptionMediaUrls(
  $: cheerio.CheerioAPI,
  attachmentPrefix: string,
  cachedUrlHashes: Map<string, string>
): string {
  for (const [tagName, attribute] of Object.entries(DESCRIPTION_MEDIA_ATTRIBUTES)) {
    $(`${tagName}[${attribute}]`).each((_, element) => {
      const media = $(element)
      const originalUrl = media.attr(attribute)
      if (!originalUrl) return

      const hash = cachedUrlHashes.get(originalUrl)
      if (!hash) return

      media.attr(attribute, `${attachmentPrefix}${hash}.webp`)

      const picture = tagName === 'img' ? media.parent('picture') : null
      if (picture?.length) {
        media.removeAttr('srcset').removeAttr('sizes')
        picture.replaceWith(media)
      }
    })
  }

  return $.root().html() ?? ''
}

/**
 * Cache external media and retain cached attachments still referenced by the description.
 */
export async function cacheDescriptionImages(gameId: string, description: string): Promise<void> {
  const cacheEnabled = await ConfigDBManager.getConfigValue(
    'game.scraper.common.cacheDescriptionImages'
  )
  if (!cacheEnabled) {
    return
  }

  const $ = cheerio.load(description, null, false)
  const descriptionMediaUrls = extractDescriptionMediaUrls($)

  // Get existing cached hashes to skip already cached images
  const existingHashes = new Set(await GameDBManager.listGameDescriptionImageHashes(gameId))

  const newImageEntries: Array<{ originalUrl: string; hash: string }> = []
  const cachedUrlHashes = new Map<string, string>()
  const neededHashes = new Set<string>()
  const attachmentPrefix = `attachment://game/${gameId}/images/description/`

  for (const originalUrl of descriptionMediaUrls) {
    if (originalUrl.startsWith('attachment://')) {
      if (originalUrl.startsWith(attachmentPrefix) && originalUrl.endsWith('.webp')) {
        neededHashes.add(originalUrl.slice(attachmentPrefix.length, -5))
      }
      continue
    }

    const hash = getUrlHash(originalUrl)
    neededHashes.add(hash)
    if (existingHashes.has(hash)) {
      cachedUrlHashes.set(originalUrl, hash)
    } else {
      newImageEntries.push({ originalUrl, hash })
    }
  }

  // Download new images in parallel
  if (newImageEntries.length > 0) {
    const results = await Promise.allSettled(
      newImageEntries.map(async ({ originalUrl, hash }) => {
        await GameDBManager.setGameDescriptionImage(gameId, hash, originalUrl)
        return { originalUrl, hash }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        cachedUrlHashes.set(result.value.originalUrl, result.value.hash)
      } else {
        log.warn(
          `[DescriptionImageCache] Failed to cache description image:`,
          result.status === 'rejected' ? result.reason : 'unknown error'
        )
      }
    }
  }

  // Delete sequentially because each attachment removal advances the PouchDB document revision.
  for (const hash of existingHashes) {
    if (neededHashes.has(hash)) continue

    await GameDBManager.removeGameDescriptionImage(gameId, hash).catch((err) => {
      log.warn(`[DescriptionImageCache] Failed to remove orphaned cache image ${hash}:`, err)
    })
  }

  // Update description with cached URLs
  if (cachedUrlHashes.size > 0) {
    const newDescription = replaceDescriptionMediaUrls($, attachmentPrefix, cachedUrlHashes)
    await GameDBManager.setGameValue(gameId, 'metadata.description', newDescription)
  }
}

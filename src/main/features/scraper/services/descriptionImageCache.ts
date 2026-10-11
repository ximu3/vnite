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
      if (!url || url.startsWith('data:') || url.startsWith('attachment://')) return

      urls.add(url)
    })
  }

  return urls
}

/**
 * Replace description URLs with cached attachment URLs for successfully cached images
 * @param $ - parsed HTML description fragment
 * @param gameId - game ID for constructing attachment URL
 * @param cachedUrlHashes - mapping of successfully cached URLs to their hashes
 * @returns description with replaced URLs
 */
function replaceDescriptionMediaUrls(
  $: cheerio.CheerioAPI,
  gameId: string,
  cachedUrlHashes: Map<string, string>
): string {
  for (const [tagName, attribute] of Object.entries(DESCRIPTION_MEDIA_ATTRIBUTES)) {
    $(`${tagName}[${attribute}]`).each((_, element) => {
      const originalUrl = $(element).attr(attribute)
      if (!originalUrl) return

      const hash = cachedUrlHashes.get(originalUrl)
      if (!hash) return

      $(element).attr(attribute, `attachment://game/${gameId}/images/description/${hash}.webp`)
    })
  }

  return $.root().html() ?? ''
}

/**
 * Cache media referenced by the raw HTML or plain-text description returned directly by a scraper.
 *
 * **NOTE**: This function is not idempotent. The description must not contain URLs previously rewritten to
 * the `attachment://` scheme, because such cached media are excluded from extraction and may be
 * removed as orphaned attachments.
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

  for (const originalUrl of descriptionMediaUrls) {
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
    const newDescription = replaceDescriptionMediaUrls($, gameId, cachedUrlHashes)
    await GameDBManager.setGameValue(gameId, 'metadata.description', newDescription)
  }
}

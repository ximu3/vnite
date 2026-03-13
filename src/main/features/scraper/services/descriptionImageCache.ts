import { createHash } from 'crypto'
import { GameDBManager, ConfigDBManager } from '~/core/database'
import log from 'electron-log/main'

/**
 * Generate MD5 hash for a URL
 */
function getUrlHash(url: string): string {
  return createHash('md5').update(url).digest('hex')
}

/**
 * Extract unique image URLs from HTML description (img src and video poster)
 * Returns an array of unique URLs
 */
function extractUniqueImageUrls(html: string): string[] {
  const urlSet = new Set<string>()

  // Match img src
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    urlSet.add(match[1])
  }

  // Match video poster
  const videoRegex = /<video[^>]+poster=["']([^"']+)["'][^>]*>/gi
  while ((match = videoRegex.exec(html)) !== null) {
    urlSet.add(match[1])
  }

  return Array.from(urlSet)
}

/**
 * From HTML description, extract image URLs and generate hashes
 * @returns Map<originalUrl, hash> - mapping from original URL to hash
 */
function extractDescriptionImageUrls(description: string): Map<string, string> {
  const images = new Map<string, string>()
  if (!description) return images

  const urls = extractUniqueImageUrls(description)
  const newUrls = urls.filter((url) => !url.startsWith('data:') && !url.startsWith('attachment://'))

  for (const url of newUrls) {
    const hash = getUrlHash(url)
    images.set(url, hash)
  }

  return images
}

/**
 * Replace description URLs with cached attachment URLs for successfully cached images
 * @param description - original HTML description
 * @param gameId - game ID for constructing attachment URL
 * @param cachedUrls - mapping of successfully cached URLs to their hashes
 * @returns description with replaced URLs
 */
function replaceDescriptionUrls(
  description: string,
  gameId: string,
  cachedUrls: Map<string, string>
): string {
  if (!description || cachedUrls.size === 0) return description

  let result = description
  for (const [originalUrl, hash] of cachedUrls) {
    const attachmentUrl = `attachment://game/${gameId}/images/description/${hash}.webp`
    result = result.split(originalUrl).join(attachmentUrl)
  }
  return result
}

export async function cacheDescriptionImages(description: string, gameId: string): Promise<void> {
  if (!description) {
    return
  }

  const cacheEnabled = await ConfigDBManager.getConfigValue(
    'game.scraper.common.cacheDescriptionImages'
  )
  if (!cacheEnabled) {
    return
  }

  const descriptionImageUrls = extractDescriptionImageUrls(description)
  if (descriptionImageUrls.size === 0) {
    return
  }

  // Get existing cached hashes to skip already cached images
  const existingHashes = await GameDBManager.listGameDescriptionImageHashes(gameId)
  const existingHashSet = new Set(existingHashes)

  const newImageEntries: [string, string][] = []
  const cachedUrls = new Map<string, string>()
  const neededHashes = new Set<string>()

  for (const [originalUrl, hash] of descriptionImageUrls) {
    neededHashes.add(hash)
    if (existingHashSet.has(hash)) {
      cachedUrls.set(originalUrl, hash)
    } else {
      newImageEntries.push([originalUrl, hash])
    }
  }

  // Download new images in parallel
  if (newImageEntries.length > 0) {
    const results = await Promise.allSettled(
      newImageEntries.map(async ([originalUrl, hash]) => {
        await GameDBManager.setGameDescriptionImage(gameId, hash, originalUrl)
        return { originalUrl, hash }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        cachedUrls.set(result.value.originalUrl, result.value.hash)
      } else {
        log.warn(
          `[DescriptionImageCache] Failed to cache description image:`,
          result.status === 'rejected' ? result.reason : 'unknown error'
        )
      }
    }
  }

  // Clean up orphaned cache images in parallel
  const orphanedHashes = existingHashes.filter((hash) => !neededHashes.has(hash))
  if (orphanedHashes.length > 0) {
    await Promise.all(
      orphanedHashes.map((hash) =>
        GameDBManager.removeGameDescriptionImage(gameId, hash).catch((err) => {
          log.warn(`[DescriptionImageCache] Failed to remove orphaned cache image ${hash}:`, err)
        })
      )
    )
  }

  // Update description with cached URLs
  if (cachedUrls.size > 0) {
    const newDescription = replaceDescriptionUrls(description, gameId, cachedUrls)
    await GameDBManager.setGameValue(gameId, 'metadata.description', newDescription)
  }
}

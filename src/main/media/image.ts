import sharp from 'sharp'
import ico from 'sharp-ico'
import { getAppTempPath } from '~/utils'
import { GameDBManager } from '~/database'
import { app, net } from 'electron'
import * as fse from 'fs-extra'
import { fileTypeFromBuffer } from 'file-type'
import { gis } from '~/utils'

/**
 * Search game related images
 * @param gameName name of game
 * @param imageType Image Type (icon, logo, hero, cover)
 * @returns Array of image links
 */
export async function searchGameImages(
  gameName: string,
  imageType: 'icon' | 'logo' | 'hero' | 'cover' | string,
  limit: number = 30
): Promise<string[]> {
  try {
    const imageUrls: string[] = []

    // Using Google Image Search
    const results = await gis(`"${gameName}" ${imageType === 'hero' ? 'wallpaper' : imageType}`)
    for (const result of results.slice(0, limit)) {
      imageUrls.push(result.url || '')
    }

    return imageUrls
  } catch (error) {
    console.error('Error searching for images:', error)
    return []
  }
}

export async function getImage(input: Buffer | string): Promise<Buffer>
{
  try
  {
    // Handles cases where the input is a URL
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await net.fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      return Buffer.from(await response.arrayBuffer())
    } else if (typeof input === 'string') {
      // If it is a local file path
      return await fse.readFile(input)
    } else {
      // If it is already Buffer
      return input
    }
  }
  catch (error)
  {
    console.error('Error getting image:', error)
    throw error
  }
}

export async function convertImage(
  input: Buffer | string,
  extension: 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'svg' | 'tiff',
  options: { quality?: number; animated?: boolean } = {}
): Promise<Buffer> {

  sharp.cache(false)
  const imageBuffer = await getImage(input)

  //Handle .ico files specially (sharp does not support .ico files)
  if (isIcoFormat(imageBuffer)) {
    const sharpInstances = ico.sharpsFromIco(imageBuffer) as sharp.Sharp[]
    if (!sharpInstances.length) throw new Error('Invalid .ico file selected')
    const largestIcon = sharpInstances[0]
    return await largestIcon.toFormat(extension, options).toBuffer()
  }
  const metadata = await sharp(imageBuffer).metadata()
  const isAnimated = Boolean(metadata?.pages && metadata.pages > 1)

  const sharpOptions: sharp.SharpOptions = {
    animated: isAnimated && (options.animated ?? true),
    limitInputPixels: false
  }

  return await sharp(imageBuffer, sharpOptions).toFormat(extension, options).toBuffer()
}

function isIcoFormat(buffer: Buffer): boolean {
  // ICO file header identification: 0 and 1 in the first 2 bytes, 1 and 0 in the 3rd and 4th bytes
  if (buffer.length >= 4) {
    return buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0
  }
  return false
}

export async function cropImage({
  sourcePath,
  x,
  y,
  width,
  height
}: {
  sourcePath: string
  x: number
  y: number
  width: number
  height: number
}): Promise<string> {
  try {
    const tempPath = getAppTempPath(`cropped_${Date.now()}.webp`)
    sharp.cache(false)
    const metadata = await sharp(sourcePath).metadata()
    let isAnimated = false
    if (metadata?.pages && metadata.pages > 1) {
      isAnimated = true
    }
    await sharp(sourcePath, { animated: isAnimated, limitInputPixels: false })
      .extract({ left: x, top: y, width, height })
      .webp({
        effort: 6,
        lossless: true
      })
      .toFile(tempPath)
    return tempPath
  } catch (error) {
    console.error('Error cropping image:', error)
    throw error
  }
}

export async function saveGameIconByFile(gameId: string, filePath: string): Promise<void> {
  try {
    // Get file icon
    const icon = await app.getFileIcon(filePath)

    // Save icon
    await GameDBManager.setGameImage(gameId, 'icon', icon.toPNG())

    console.log('Save Icon Successful:', filePath)
  } catch (error) {
    console.error('Failed to save icon:', error)
    throw error
  }
}

export async function downloadTempImage(url: string): Promise<string> {
  try {
    // Download file, add common browser headers
    const response = await net.fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: new URL(url).origin,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Verify the actual file type
    const fileType = await fileTypeFromBuffer(buffer as Uint8Array)
    const ext = fileType?.ext || 'webp'
    const filePath = getAppTempPath(`${Date.now()}.${ext}`)

    await fse.writeFile(filePath, buffer)
    return filePath
  } catch (error) {
    console.error('Failed to download image:', error)
    throw error
  }
}

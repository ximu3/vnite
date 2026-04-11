import { execFile } from 'child_process'
import { clipboard, nativeImage, net } from 'electron'
import { fileTypeFromBuffer } from 'file-type'
import fse from 'fs-extra'
import sharp from 'sharp'
import ico from 'sharp-ico'
import { promisify } from 'util'
import { getAppTempPath } from '~/features/system'
import { gis } from '~/utils'

const execFileAsync = promisify(execFile)

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

export async function convertToWebP(
  input: Buffer | string,
  options: { quality?: number; animated?: boolean } = {}
): Promise<Buffer> {
  try {
    sharp.cache(false)

    // Handles cases where the input is a URL
    let imageBuffer: Buffer
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await net.fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    } else if (typeof input === 'string') {
      // If it is a local file path
      imageBuffer = await fse.readFile(input)
    } else {
      // If it is already Buffer
      imageBuffer = input
    }

    const isIco = isIcoFormat(imageBuffer)

    if (isIco) {
      // Handling ICO files with sharp-ico
      // Get the largest size image in the ICO as a conversion source
      const sharpInstances = ico.sharpsFromIco(imageBuffer) as sharp.Sharp[]

      if (sharpInstances.length === 0) {
        throw new Error('No valid images found in ICO file')
      }

      // Select the image with the highest resolution (usually the first one in the ICO file)
      const largestIcon = sharpInstances[0]

      // Convert to WebP
      return await largestIcon
        .webp({
          quality: options.quality ?? 100
        })
        .toBuffer()
    }

    const metadata = await sharp(imageBuffer).metadata()

    let isAnimated = false
    if (metadata?.pages && metadata.pages > 1) {
      isAnimated = true
    }

    return await sharp(imageBuffer, {
      animated: isAnimated && (options.animated ?? true),
      limitInputPixels: false
    })
      .webp({
        quality: options.quality ?? 100
      })
      .toBuffer()
  } catch (error) {
    console.error('Error converting image to WebP:', error)
    throw error
  }
}

export async function convertToPng(input: Buffer | string): Promise<Buffer> {
  try {
    sharp.cache(false)

    // Handles cases where the input is a URL
    let imageBuffer: Buffer
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await net.fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    } else if (typeof input === 'string') {
      // If it is a local file path
      imageBuffer = await fse.readFile(input)
    } else {
      // If it is already Buffer
      imageBuffer = input
    }

    return await sharp(imageBuffer).png().toBuffer()
  } catch (error) {
    console.error('Error converting image to PNG:', error)
    throw error
  }
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

export async function saveClipboardImage(): Promise<string> {
  try {
    const image = clipboard.readImage()
    if (image.isEmpty()) {
      return ''
    }

    const buffer = image.toPNG()
    const filePath = getAppTempPath(`${Date.now()}.png`)
    await fse.writeFile(filePath, buffer)
    return filePath
  } catch (error) {
    console.error('Failed to save image in clipboard:', error)
    throw error
  }
}

export async function writeClipboardImage(data: string, type: 'path'): Promise<boolean> {
  try {
    let buffer
    switch (type) {
      case 'path':
        buffer = await sharp(data).png().toBuffer()
    }
    const image = nativeImage.createFromBuffer(buffer)

    if (!image.isEmpty()) {
      clipboard.writeImage(image)
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to write image to clipboard:', error)
    throw error
  }
}

export async function upscaleImage(
  input: Buffer | string,
  exePath: string,
  options: { scale?: number } = {}
): Promise<Buffer> {
  const scale = options.scale ?? 2
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const inputPath = getAppTempPath(`upscale_input_${suffix}.png`)
  const outputPath = getAppTempPath(`upscale_output_${suffix}.png`)

  try {
    // Prepare input: convert to local PNG file
    let imageBuffer: Buffer
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await net.fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    } else if (typeof input === 'string') {
      imageBuffer = await fse.readFile(input)
    } else {
      imageBuffer = input
    }

    // Convert to PNG for maximum compatibility with ncnn-vulkan tools
    sharp.cache(false)
    const pngBuffer = await sharp(imageBuffer, { limitInputPixels: false }).png().toBuffer()
    await fse.writeFile(inputPath, pngBuffer)

    // Build arguments: all three tools share -i -o -s interface
    const args = ['-i', inputPath, '-o', outputPath, '-s', String(scale)]

    // Execute the upscaler
    await execFileAsync(exePath, args, {
      timeout: 5 * 60 * 1000, // 5 minute timeout
      windowsHide: true
    })

    // Read and return the output
    const result = await fse.readFile(outputPath)
    return result
  } catch (error) {
    console.error('Error upscaling image:', error)
    throw error
  } finally {
    // Clean up temp files
    await fse.remove(inputPath).catch(() => {})
    await fse.remove(outputPath).catch(() => {})
  }
}

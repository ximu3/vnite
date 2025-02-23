import sharp from 'sharp'
import { getAppTempPath } from '~/utils'
import { GameDBManager } from '~/database'
import { app } from 'electron'
import fetch from 'node-fetch'
import fse from 'fs-extra'
import { fileTypeFromBuffer } from 'file-type'

export async function convertToWebP(
  input: Buffer | string,
  options: { quality?: number; animated?: boolean } = {}
): Promise<Buffer> {
  try {
    sharp.cache(false)
    const metadata = await sharp(input).metadata()
    let isAnimated = false
    if (metadata?.pages && metadata.pages > 1) {
      isAnimated = true
    }

    return await sharp(input, {
      animated: isAnimated && (options.animated ?? true),
      limitInputPixels: false
    })
      .webp({
        quality: options.quality ?? 100,
        effort: 6,
        lossless: true,
        alphaQuality: 100
      })
      .toBuffer()
  } catch (error) {
    console.error('Error converting image to WebP:', error)
    throw error
  }
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

    console.log('保存图标成功:', filePath)
  } catch (error) {
    console.error('保存图标失败:', error)
    throw error
  }
}

export async function downloadTempImage(url: string): Promise<string> {
  // Download file
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Verify the actual file type
  const fileType = await fileTypeFromBuffer(buffer as Uint8Array)
  const ext = fileType?.ext || 'webp'
  const filePath = getAppTempPath(`${Date.now()}.${ext}`)

  await fse.writeFile(filePath, buffer)
  return filePath
}

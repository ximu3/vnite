import sharp from 'sharp'
import ico from 'sharp-ico'
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

    // 处理输入是URL的情况
    let imageBuffer: Buffer
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    } else if (typeof input === 'string') {
      // 如果是本地文件路径
      imageBuffer = await fse.readFile(input)
    } else {
      // 如果已经是Buffer
      imageBuffer = input
    }

    const isIco = isIcoFormat(imageBuffer)

    if (isIco) {
      // 使用sharp-ico处理ICO文件
      // 获取ICO中最大尺寸的图像作为转换源
      const sharpInstances = ico.sharpsFromIco(imageBuffer) as sharp.Sharp[]

      if (sharpInstances.length === 0) {
        throw new Error('No valid images found in ICO file')
      }

      // 选择分辨率最高的图像（通常是ICO文件中的第一个）
      const largestIcon = sharpInstances[0]

      // 转换为WebP
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

    // 处理输入是URL的情况
    let imageBuffer: Buffer
    if (typeof input === 'string' && input.startsWith('http')) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      imageBuffer = Buffer.from(await response.arrayBuffer())
    } else if (typeof input === 'string') {
      // 如果是本地文件路径
      imageBuffer = await fse.readFile(input)
    } else {
      // 如果已经是Buffer
      imageBuffer = input
    }

    return await sharp(imageBuffer).png().toBuffer()
  } catch (error) {
    console.error('Error converting image to PNG:', error)
    throw error
  }
}

function isIcoFormat(buffer: Buffer): boolean {
  // ICO文件头标识: 前2字节为0和1，第3和第4字节为1和0
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

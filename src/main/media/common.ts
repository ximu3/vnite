import {
  getCoverPath,
  getBackgroundPath,
  getIconPath,
  getLogoPath,
  setBackgroundWithFile,
  setBackgroundWithUrl,
  setCoverWithFile,
  setCoverWithUrl,
  setIconWithFile,
  setIconWithUrl,
  setLogoWithFile,
  setLogoWithUrl
} from './image'
import fse from 'fs-extra'
import { getDataPath } from '~/utils'
import { app } from 'electron'
import path from 'path'

export async function getMediaPath(
  gameId: string,
  type: 'cover' | 'background' | 'icon' | 'logo'
): Promise<string> {
  switch (type) {
    case 'cover':
      return getCoverPath(gameId)
    case 'background':
      return getBackgroundPath(gameId)
    case 'icon':
      return getIconPath(gameId)
    case 'logo':
      return getLogoPath(gameId)
  }
}

export async function setMediaWithFile(
  gameId: string,
  type: 'cover' | 'background' | 'icon' | 'logo',
  filePath: string
): Promise<void> {
  switch (type) {
    case 'cover':
      return setCoverWithFile(gameId, filePath)
    case 'background':
      return setBackgroundWithFile(gameId, filePath)
    case 'icon':
      if (path.extname(filePath).slice(1).toLowerCase() === 'exe') {
        return saveFileIcon(gameId, filePath)
      }
      return setIconWithFile(gameId, filePath)
    case 'logo':
      return setLogoWithFile(gameId, filePath)
  }
}

export async function setMediaWithUrl(
  gameId: string,
  type: 'cover' | 'background' | 'icon' | 'logo',
  url: string
): Promise<void> {
  switch (type) {
    case 'cover':
      return setCoverWithUrl(gameId, url)
    case 'background':
      return setBackgroundWithUrl(gameId, url)
    case 'icon':
      return setIconWithUrl(gameId, url)
    case 'logo':
      return setLogoWithUrl(gameId, url)
  }
}

type SourceType = 'url' | 'file' | 'invalid'

export async function detectSourceType(source: string): Promise<SourceType> {
  // 1. First check if it is a valid URL
  if (isValidUrl(source)) {
    return 'url'
  }

  // 2. Check if it is a valid file path
  try {
    const stats = await fse.stat(source)
    return stats.isFile() ? 'file' : 'invalid'
  } catch {
    return 'invalid'
  }
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

export async function saveFileIcon(gameId: string, filePath: string): Promise<void> {
  try {
    // Get file icon
    const icon = await app.getFileIcon(filePath)

    // Get save path
    const iconPath = await getDataPath(`games/${gameId}/icon.png`)

    // Convert NativeImage to PNG Buffer
    const pngBuffer = icon.toPNG()

    // Saving PNG files
    await fse.writeFile(iconPath, pngBuffer)

    console.log(`图标已保存至: ${iconPath}`)
  } catch (error) {
    console.error('保存图标失败:', error)
    throw error
  }
}

export async function checkIconExists(gameId: string): Promise<boolean> {
  const iconPath = await getIconPath(gameId)
  if (!iconPath) {
    return false
  } else {
    return true
  }
}

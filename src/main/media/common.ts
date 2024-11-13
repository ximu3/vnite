import {
  getCoverPath,
  getBackgroundPath,
  getIconPath,
  setBackgroundWithFile,
  setBackgroundWithUrl,
  setCoverWithFile,
  setCoverWithUrl,
  setIconWithFile,
  setIconWithUrl
} from './image'
import fse from 'fs-extra'

export async function getMediaPath(
  gameId: string,
  type: 'cover' | 'background' | 'icon'
): Promise<string> {
  switch (type) {
    case 'cover':
      return getCoverPath(gameId)
    case 'background':
      return getBackgroundPath(gameId)
    case 'icon':
      return getIconPath(gameId)
  }
}

export async function setMediaWithFile(
  gameId: string,
  type: 'cover' | 'background' | 'icon',
  filePath: string
): Promise<void> {
  switch (type) {
    case 'cover':
      return setCoverWithFile(gameId, filePath)
    case 'background':
      return setBackgroundWithFile(gameId, filePath)
    case 'icon':
      return setIconWithFile(gameId, filePath)
  }
}

export async function setMediaWithUrl(
  gameId: string,
  type: 'cover' | 'background' | 'icon',
  url: string
): Promise<void> {
  switch (type) {
    case 'cover':
      return setCoverWithUrl(gameId, url)
    case 'background':
      return setBackgroundWithUrl(gameId, url)
    case 'icon':
      return setIconWithUrl(gameId, url)
  }
}

type SourceType = 'url' | 'file' | 'invalid'

export async function detectSourceType(source: string): Promise<SourceType> {
  // 1. 首先检查是否是有效的 URL
  if (isValidUrl(source)) {
    return 'url'
  }

  // 2. 检查是否是有效的文件路径
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

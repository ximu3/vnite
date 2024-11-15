import {
  getMediaPath,
  setMediaWithFile,
  setMediaWithUrl,
  detectSourceType,
  saveFileIcon,
  checkIconExists
} from './common'
import log from 'electron-log/main.js'

export async function getMedia(
  gameId: string,
  type: 'cover' | 'background' | 'icon'
): Promise<string> {
  try {
    return await getMediaPath(gameId, type)
  } catch (error) {
    log.error('Failed to get media', {
      gameId,
      type,
      error
    })
    return ''
  }
}

export async function setMedia(
  gameId: string,
  type: 'cover' | 'background' | 'icon',
  source: string
): Promise<void> {
  try {
    const sourceType = await detectSourceType(source)

    switch (sourceType) {
      case 'url':
        await setMediaWithUrl(gameId, type, source)
        break
      case 'file':
        await setMediaWithFile(gameId, type, source)
        break
      default:
        throw new Error(`Invalid source type: ${source}`)
    }
  } catch (error) {
    log.error('Failed to set media', {
      gameId,
      type,
      source,
      error
    })
    throw error
  }
}

export async function saveIcon(gameId: string, filePath: string): Promise<void> {
  try {
    await saveFileIcon(gameId, filePath)
  } catch (error) {
    log.error('Failed to save icon', {
      gameId,
      filePath,
      error
    })
    throw error
  }
}

export async function checkIcon(gameId: string): Promise<boolean> {
  try {
    return await checkIconExists(gameId)
  } catch (error) {
    log.error('Failed to check icon', {
      gameId,
      error
    })
    return false
  }
}

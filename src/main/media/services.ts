import { getMediaPath, setMediaWithFile, setMediaWithUrl, detectSourceType } from './common'
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

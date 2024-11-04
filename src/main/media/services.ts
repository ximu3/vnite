import { getMediaPath } from './common'
import log from 'electron-log/main.js'

export async function getMedia(
  gameId: string,
  type: 'cover' | 'background' | 'icon'
): Promise<string> {
  try {
    return await getMediaPath(gameId, type)
  } catch (error) {
    log.error('Failed to get media', error)
    return ''
  }
}

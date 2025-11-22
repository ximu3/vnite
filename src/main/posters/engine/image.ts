import { CanvasImage } from '@appTypes/poster/poster'
import { loadImage } from 'skia-canvas'
import { GameDBManager } from '~/core/database'

export async function loadGameImagesByType(
  gameIds: string[],
  type: 'background' | 'cover' | 'icon' | 'logo'
): Promise<(CanvasImage | null)[]> {
  return Promise.all(
    gameIds.map(async (id) => {
      try {
        const buf = await GameDBManager.getGameImage(id, type, 'buffer')
        if (!buf) return null

        return await loadImage(buf).catch(() => null)
      } catch (err) {
        console.error(`Failed to load image for gameId=${id}, type=${type}`, err)
        return null
      }
    })
  )
}

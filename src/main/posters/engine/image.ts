import { CanvasContext, CanvasImage } from '@appTypes/poster/poster'
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

export function drawImageCover(
  ctx: CanvasContext,
  img: CanvasImage | null,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  const wTarget = x2 - x1
  const hTarget = y2 - y1

  const imgRatio = img.width / img.height
  const targetRatio = wTarget / hTarget

  let sx = 0
  let sy = 0
  let sWidth = img.width
  let sHeight = img.height

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio
    sx = (img.width - sWidth) / 2
  } else {
    sHeight = img.width / targetRatio
    sy = (img.height - sHeight) / 2
  }

  ctx.drawImage(
    img,
    sx,
    sy,
    sWidth,
    sHeight, // 裁剪源
    x1,
    y1,
    wTarget,
    hTarget // 目标框
  )
}

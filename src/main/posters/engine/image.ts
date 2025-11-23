import { CanvasContext, CanvasImage } from '@appTypes/poster'
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
  y2: number,
  placeholder?: (ctx: CanvasContext, x1: number, y1: number, x2: number, y2: number) => void
): void {
  const wTarget = x2 - x1
  const hTarget = y2 - y1

  if (img) {
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
      sHeight, // Crop source
      x1,
      y1,
      wTarget,
      hTarget // Target box
    )
  } else {
    ctx.save()

    if (placeholder) {
      placeholder(ctx, x1, y1, x2, y2)
    }
    ctx.restore()
  }
}

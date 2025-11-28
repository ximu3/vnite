import { CanvasContext, CanvasImage } from '@appTypes/poster'
import { loadImage } from 'skia-canvas'
import { GameDBManager } from '~/core/database'
import { crop } from './smartcrop-sharp'

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

export async function drawImageCover(
  ctx: CanvasContext,
  img: CanvasImage | null,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  placeholder?: (ctx: CanvasContext, x1: number, y1: number, x2: number, y2: number) => void
): Promise<void> {
  const wTarget = x2 - x1
  const hTarget = y2 - y1

  if (img) {
    const imgRatio = img.width / img.height
    const targetRatio = wTarget / hTarget

    let sx = 0
    let sy = 0
    let sWidth = img.width
    let sHeight = img.height

    // Symmetric metric for aspect ratio difference:
    // - swapping imgRatio and targetRatio does not change the value
    // - swapping width and height of either ratio (transpose) also preserves the value
    const ratioDiff = Math.abs(Math.log(imgRatio / targetRatio))

    // Use smartcrop when the cropped portion exceeds roughly 22% relative to the visible area
    // Computed as: exp(ratioDiff) - 1
    if (ratioDiff > 0.2) {
      const bestCrop = (await crop(img, { width: wTarget, height: hTarget })).topCrop
      if (bestCrop) {
        sx = bestCrop.x
        sy = bestCrop.y
        sWidth = bestCrop.width
        sHeight = bestCrop.height
      }
    } else {
      if (imgRatio > targetRatio) {
        sWidth = img.height * targetRatio
        sx = (img.width - sWidth) / 2
      } else {
        sHeight = img.width / targetRatio
        sy = (img.height - sHeight) / 2
      }
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

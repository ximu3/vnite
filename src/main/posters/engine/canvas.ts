import { CanvasContext } from '@appTypes/poster/poster'
import fse from 'fs-extra'
import path from 'path'
import { Canvas } from 'skia-canvas'
import { fontManager } from './font'

export function createCanvas(
  width: number,
  height: number,
  bg: string = 'hsl(230 24% 19%)'
): { canvas: Canvas; ctx: CanvasContext } {
  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  fontManager.reset()
  fontManager.apply(ctx)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  return { canvas, ctx }
}

export async function saveCanvas(canvas: Canvas, outputPath: string): Promise<void> {
  const buffer = await canvas.toBuffer('png')
  await fse.ensureDir(path.dirname(outputPath))
  await fse.writeFile(outputPath, buffer)
}

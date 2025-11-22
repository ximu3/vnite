import { CanvasContext } from '@appTypes/poster/poster'
import fse from 'fs-extra'
import path from 'path'
import { Canvas } from 'skia-canvas'
import { fontManager } from './font'

export function createCanvas(
  width: number,
  height: number,
  bg: string = '#fff'
): { canvas: Canvas; ctx: CanvasContext } {
  const canvas = new Canvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  fontManager.reset()
  fontManager.apply(ctx)

  return { canvas, ctx }
}

export async function saveCanvas(canvas: Canvas, outputPath: string): Promise<void> {
  const buffer = await canvas.toBuffer('png')
  await fse.ensureDir(path.dirname(outputPath))
  await fse.writeFile(outputPath, buffer)
}

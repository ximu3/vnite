import { CanvasContext } from '@appTypes/poster'
import fse from 'fs-extra'
import path from 'path'
import { Canvas, loadImage } from 'skia-canvas'
import { ConfigDBManager } from '~/core/database'
import icon from '../../../../resources/icon.png?asset'
import { fontManager } from './font'

const creditPadding = 8
const logoSize = 20

async function drawPosterCredit(
  canvas: Canvas,
  ctx: CanvasContext,
  color: string = 'hsl(230 12% 81%)'
): Promise<void> {
  const text = `Vnite 生成`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = color

  // draw credit
  fontManager.save()
  fontManager.setFontSize(logoSize - 4)
  fontManager.apply(ctx)

  const textWidth = ctx.measureText(text).width
  ctx.fillText(text, canvas.width - creditPadding, canvas.height - creditPadding)
  fontManager.restore()

  // draw logo
  const img = await loadImage(icon)
  const logoX = canvas.width - creditPadding - textWidth - logoSize - 4
  const logoY = canvas.height - creditPadding - logoSize
  ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
}

export async function createCanvas(
  width: number,
  height: number,
  bg: string = 'hsl(230 24% 19%)'
): Promise<{ canvas: Canvas; ctx: CanvasContext }> {
  const height_e = height + logoSize + 2 * creditPadding // expand for credit area
  const canvas = new Canvas(width, height_e)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height_e)

  fontManager.reset()
  fontManager.setFontFamily(await ConfigDBManager.getConfigValue('appearances.fonts.family'))
  fontManager.apply(ctx)

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  await drawPosterCredit(canvas, ctx)

  return { canvas, ctx }
}

export async function saveCanvas(canvas: Canvas, outputPath: string): Promise<void> {
  const buffer = await canvas.toBuffer('png')
  await fse.ensureDir(path.dirname(outputPath))
  await fse.writeFile(outputPath, buffer)
}

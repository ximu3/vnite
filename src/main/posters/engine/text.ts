import { CanvasContext } from '@appTypes/poster'
import { fontManager } from './font'

export function drawTextFit(
  ctx: CanvasContext,
  text: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = 'hsl(223 30% 75%)',
  originalSize: number = 28
): void {
  // Original, for drawing
  const width_o = x2 - x1
  const height_o = y2 - y1
  // Scaled, for calculation
  const width_s = ((x2 - x1) * 4) / 5
  const height_s = ((y2 - y1) * 3) / 4

  let fontSize = originalSize
  fontManager.setFontSize(fontSize)
  fontManager.apply(ctx)

  let lines: string[] = []

  const splitTextIntoLines = (fs: number): string[] => {
    fontManager.setFontSize(fs)
    fontManager.apply(ctx)
    const result: string[] = []
    let currentLine = ''
    for (const char of text) {
      const testLine = currentLine + char
      if (ctx.measureText(testLine).width > width_s && currentLine) {
        result.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) result.push(currentLine)
    return result
  }

  while (true) {
    lines = splitTextIntoLines(fontSize)
    const totalHeight = lines.length * fontSize * 1.2
    if (totalHeight <= height_s || fontSize <= 1) break
    fontSize = Math.floor(Math.max(fontSize * 0.75, (fontSize * height_s) / totalHeight))
  }

  // Draw Text
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const totalHeight = lines.length * fontSize * 1.2 // gap between lines
  let startY = y1 + (height_o - totalHeight) / 2 + fontSize * 0.6

  for (const line of lines) {
    ctx.fillText(line, x1 + width_o / 2, startY)
    startY += fontSize * 1.2
  }
}

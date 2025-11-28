import { CanvasContext, PosterTemplate, ScoreReportPayload } from '@appTypes/poster'
import { createCanvas } from '~/posters/engine/canvas'
import { drawImageCover, loadGameImagesByType } from '~/posters/engine/image'
import { drawTextFit } from '~/posters/engine/text'
import { getAllGameScore, scoreLevels, ScoreReportData } from '~/posters/utils/score'
import { fontManager } from '../engine/font'

interface CanvasLayout {
  width: number
  height: number
  lines: number[] // The y coordinate of the five horizontal split lines
  games: {
    gameId: string
    x1: number
    y1: number
    x2: number
    y2: number
    scoreX: number
    scoreY: number
  }[]
}

const SCORE_R = 24
const SCORE_MARGIN = 8

function calcCanvasLayout(data: ScoreReportData, payload: ScoreReportPayload): CanvasLayout {
  const ratio = 2 / 3
  const H_big = payload.gameCoverHeightLarge
  const H_small = payload.gameCoverHeightSmall
  const W_big = H_big * ratio
  const W_small = H_small * ratio

  const padding = payload.padding
  const gap = payload.gap
  const maxWidth = payload.maxWidth

  // Calculate the layout position of each game cover
  const configPerLevel: Record<(typeof scoreLevels)[number], boolean> = {
    level1: payload.useSmallCover1,
    level2: payload.useSmallCover2,
    level3: payload.useSmallCover3,
    level4: payload.useSmallCover4,
    level5: payload.useSmallCover5
  } // true for small
  const res: CanvasLayout = { width: 1600, height: 900, lines: [], games: [] }
  let lastLineY = 0
  for (const [level, games] of Object.entries(data)) {
    let x1 = payload.titleWidth + padding
    let y1 = lastLineY + padding
    const useLarge = !configPerLevel[level]
    let x2 = x1 + (useLarge ? W_big : W_small)
    let y2 = y1 + (useLarge ? H_big : H_small)

    for (const { gameId } of games) {
      if (x2 > maxWidth - padding) {
        x1 = payload.titleWidth + padding
        y1 = y2 + gap
        x2 = x1 + (useLarge ? W_big : W_small)
        y2 = y1 + (useLarge ? H_big : H_small)
      }

      res.games.push({
        gameId,
        x1,
        y1,
        x2,
        y2,
        scoreX: x2 - SCORE_R - SCORE_MARGIN,
        scoreY: y2 - SCORE_R - SCORE_MARGIN
      })

      // Position of the next cover
      x1 = x2 + gap
      x2 = x1 + (useLarge ? W_big : W_small)
    }
    lastLineY = y2 + padding
    res.lines.push(lastLineY)
  }
  const maxX = Math.max(...res.games.map((g) => g.x2))
  const maxY = Math.max(...res.games.map((g) => g.y2))
  res.height = maxY + padding
  res.width = maxX + padding

  return res
}

function drawScoreCircle(
  ctx: CanvasContext,
  x: number,
  y: number,
  r: number,
  score: number,
  circleColor: string,
  fontColor: string
): void {
  // Circle
  ctx.beginPath()
  ctx.fillStyle = circleColor
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  // Text
  fontManager.setFontSize(18)
  fontManager.setFontWeight('bold')
  fontManager.apply(ctx)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fontColor
  ctx.fillText(String(score), x, y)
}

export const scoreReportPoster: PosterTemplate<ScoreReportPayload> = {
  id: 'scoreReport',

  async render(payload) {
    const scoreData = await getAllGameScore()
    const { height, width, lines, games } = calcCanvasLayout(scoreData, payload)

    const { canvas, ctx } = await createCanvas(width, height, payload.backgroundColor)

    const images = await loadGameImagesByType(
      games.map((g) => g.gameId),
      'cover'
    )
    const scoreDataFlat = scoreLevels.flatMap((level) => scoreData[level] ?? [])

    for (let i = 0; i < games.length; i++) {
      const { x1, x2, y1, y2, scoreX, scoreY } = games[i]
      const img = images[i]

      const placeholder: Parameters<typeof drawImageCover>[6] = (ctx, x1, y1, x2, y2) => {
        const w = x2 - x1
        const h = y2 - y1
        ctx.strokeStyle = payload.splitColor
        ctx.lineWidth = 2
        ctx.strokeRect(x1, y1, w, h)

        drawTextFit(ctx, scoreDataFlat[i].gameName, x1, y1, x2, y2, 4 / 5, 3 / 4, payload.fontColor)
      }

      await drawImageCover(ctx, img, x1, y1, x2, y2, placeholder)
      if (payload.drawScore)
        drawScoreCircle(
          ctx,
          scoreX,
          scoreY,
          SCORE_R,
          scoreDataFlat[i].score,
          payload.scoreColor,
          payload.fontColor
        )
    }

    const titleColors = [
      payload.titleColor1,
      payload.titleColor2,
      payload.titleColor3,
      payload.titleColor4,
      payload.titleColor5
    ]
    let lastY = 0
    for (let i = 0; i < lines.length; i++) {
      const y1 = lastY
      const y2 = lines[i]
      const height = y2 - y1

      ctx.fillStyle = titleColors[i]
      ctx.fillRect(0, y1, payload.titleWidth, height)

      lastY = y2
    }

    ctx.strokeStyle = payload.splitColor
    ctx.lineWidth = payload.splitWidth
    for (const y of lines) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    return { canvas, width, height }
  }
}

import { CanvasImage, PosterTemplate } from '@appTypes/poster/poster'
import { TestPosterPayload } from '@appTypes/poster/templates'
import { GameDBManager } from '~/core/database'
import { createCanvas } from '~/posters/engine/canvas'
import { loadGameImagesByType } from '~/posters/engine/image'

export const testPoster: PosterTemplate<TestPosterPayload> = {
  id: 'test',

  async render(payload) {
    const width = 800
    const height = 1200
    const { canvas, ctx } = createCanvas(width, height, '#222')

    const allGameId = Object.keys(await GameDBManager.getAllGames())
    const images = (await loadGameImagesByType(
      [allGameId[0], allGameId[1]],
      'cover'
    )) as CanvasImage[]

    const bigH = 600
    ctx.drawImage(images[0], 0, 0, width, bigH)

    const smallW = 120
    const smallH = 120
    ctx.drawImage(images[1], width - smallW - 40, 40, smallW, smallH)

    ctx.font = 'bold 64px sans-serif'
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'left'
    ctx.fillText(payload.title, 40, bigH + 120)

    ctx.font = '28px sans-serif'
    ctx.fillStyle = '#ddd'
    ctx.fillText(payload.subtitle, 40, bigH + 200)

    return { canvas, width, height }
  }
}

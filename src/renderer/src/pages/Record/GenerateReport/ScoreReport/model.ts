import type { TFunction } from 'i18next'
import type { AttachmentState } from '~/stores'
import type { GameMetaInfo } from '~/stores/game'
import { prepareReportCover } from '../utils/image'
import type { ScoreReportExportGame, ScoreReportExportModel } from './types'

const ASSET_CONCURRENCY = 4

async function prepareGameCover(
  game: ScoreReportExportGame,
  coverWidth: number
): Promise<ScoreReportExportGame> {
  if (!game.coverSrc) return game

  try {
    const cover = await prepareReportCover({
      src: game.coverSrc,
      width: coverWidth,
      height: coverWidth * 1.5
    })
    return { ...game, coverSrc: cover.src, coverPosition: cover.position }
  } catch {
    return { ...game, coverSrc: null, coverPosition: 'center' }
  }
}

export function createScoreReportExportModel(
  t: TFunction<'record'>,
  language: string,
  categories: Array<{ id: string; games: string[] }>,
  gameMetaIndex: Record<string, GameMetaInfo>,
  attachments: AttachmentState['attachments']
): ScoreReportExportModel {
  return {
    language,
    title: t('score.title'),
    categories: categories
      .filter((category) => category.games.length > 0)
      .map((category) => ({
        id: category.id,
        countLabel: t('score.categories.gamesCount', { count: category.games.length }),
        games: category.games.map((gameId) => {
          const game = gameMetaIndex[gameId]
          const attachmentInfo = attachments.game?.[gameId]?.['images/cover.webp']

          return {
            id: gameId,
            name: game?.name || t('score.gameInfo.unknown'),
            score: game?.score ?? 0,
            coverSrc: attachmentInfo?.error
              ? null
              : `attachment://game/${gameId}/images/cover.webp?t=${attachmentInfo?.timestamp ?? 0}`,
            coverPosition: 'center'
          }
        })
      }))
  }
}

export async function inlineScoreReportAssets(
  model: ScoreReportExportModel,
  coverWidth: number
): Promise<ScoreReportExportModel> {
  const games = model.categories.flatMap((category) => category.games)
  const preparedGames = new Map<string, ScoreReportExportGame>()
  let cursor = 0

  const worker = async (): Promise<void> => {
    while (cursor < games.length) {
      const game = games[cursor]
      cursor += 1
      preparedGames.set(game.id, await prepareGameCover(game, coverWidth))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(ASSET_CONCURRENCY, games.length) }, () => worker())
  )

  return {
    ...model,
    categories: model.categories.map((category) => ({
      ...category,
      games: category.games.map((game) => preparedGames.get(game.id) ?? game)
    }))
  }
}

export function collectScoreReportText(model: ScoreReportExportModel): string {
  const text = [model.title]

  for (const category of model.categories) {
    text.push(category.countLabel)
    for (const game of category.games) {
      text.push(game.name, game.score.toFixed(1))
    }
  }

  return text.join('\n')
}

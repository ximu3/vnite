import { NSFWFilterMode } from '@appTypes/models'
import {
  type GamePlayTimeReport,
  type GamePlayTimeReportItem,
  type ReportExportResponse
} from '@appTypes/report'
import { format } from 'date-fns'
import { ipcManager } from '~/app/ipc'
import { getGameStore, useGameCollectionStore } from '~/stores/game'

function formatReportGeneratedAt(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm:ss 'UTC'xxx")
}

function createGamePlayTimeReport(
  includedGameIds: readonly string[],
  nsfwFilterMode: NSFWFilterMode,
  generatedAt: Date
): GamePlayTimeReport {
  const createReportItem = (name: string, playTimeMs: number): GamePlayTimeReportItem => ({
    name,
    playTimeMs,
    playTimeHours: Math.round((playTimeMs / 3600000) * 10) / 10
  })
  const includedGames = new Map<string, GamePlayTimeReportItem>()

  for (const gameId of new Set(includedGameIds)) {
    const game = getGameStore(gameId).getState().getData()
    if (!game) continue

    const playTimeMs = Number.isFinite(game.record.playTime) ? game.record.playTime : 0
    includedGames.set(gameId, createReportItem(game.metadata.name, playTimeMs))
  }

  const gameItems = Array.from(includedGames.values()).sort(
    (a, b) => b.playTimeMs - a.playTimeMs || a.name.localeCompare(b.name)
  )

  const collectionItems = Object.values(useGameCollectionStore.getState().documents)
    .sort((a, b) => a.sort - b.sort)
    .map((collection) => {
      let playTimeMs = 0

      for (const gameId of new Set(collection.games)) {
        playTimeMs += includedGames.get(gameId)?.playTimeMs ?? 0
      }

      return createReportItem(collection.name, playTimeMs)
    })

  return {
    generatedAt: formatReportGeneratedAt(generatedAt),
    nsfwFilter:
      nsfwFilterMode === NSFWFilterMode.HideNSFW
        ? 'SFW'
        : nsfwFilterMode === NSFWFilterMode.OnlyNSFW
          ? 'NSFW'
          : 'ALL',
    games: gameItems,
    collections: collectionItems
  }
}

export async function exportGamePlayTimeReport(
  outputPath: string,
  includedGameIds: readonly string[],
  nsfwFilterMode: NSFWFilterMode
): Promise<ReportExportResponse> {
  const generatedAt = new Date()
  const report = createGamePlayTimeReport(includedGameIds, nsfwFilterMode, generatedAt)
  const filename = `gamePlayTime-${format(generatedAt, 'yyyyMMdd-HHmmss')}.json`
  const outputFile = window.api.path.join(outputPath, filename)
  const content = `${JSON.stringify(report, null, 2)}\n`

  await ipcManager.invoke('system:write-text-file', outputFile, content)

  return { outputFile }
}

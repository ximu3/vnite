import { NSFWFilterMode } from '@appTypes/models'
import { type ReportExportResponse } from '@appTypes/report'
import { type GamePlayTimeReportItem } from '@appTypes/report/gamePlayTime'
import { Button } from '@ui/button'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfigState } from '~/hooks'
import { getGameStore, useGameCollectionStore, useNSFWFilteredGameIds } from '~/stores/game'
import { EmptyReportConfigForm } from '../settings'
import type { ReportGeneratorProps } from '../types'
import { exportJsonReport, formatReportGeneratedAt } from '../utils'

function createReportItem(name: string, playTimeMs: number): GamePlayTimeReportItem {
  return {
    name,
    playTimeMs,
    playTimeHours: Math.round((playTimeMs / 3600000) * 10) / 10
  }
}

async function exportGamePlayTimeReport(
  outputPath: string,
  includedGameIds: readonly string[],
  nsfwFilterMode: NSFWFilterMode
): Promise<ReportExportResponse> {
  const generatedAt = new Date()
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

  const report = {
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
  return await exportJsonReport('gamePlayTime', outputPath, report)
}

export function GamePlayTimeReportGenerator({
  outputPath,
  isExporting,
  resolveOutputPath,
  onExportingChange
}: ReportGeneratorProps): React.JSX.Element {
  const { t } = useTranslation('record')
  const filteredGameIds = useNSFWFilteredGameIds()
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')

  const exportReport = async (): Promise<void> => {
    if (isExporting) return

    const resolvedOutputPath = outputPath || (await resolveOutputPath())
    if (!resolvedOutputPath) return

    onExportingChange(true)
    const exportPromise = exportGamePlayTimeReport(
      resolvedOutputPath,
      filteredGameIds,
      nsfwFilterMode
    ).finally(() => onExportingChange(false))

    toast.promise(exportPromise, {
      loading: t('exportReport.message.loading.json'),
      success: (result) => t('exportReport.message.success', { file: result.outputFile }),
      error: (error) =>
        `${t('exportReport.message.error')}: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  return (
    <>
      <div className="flex justify-end ml-4">
        <Button disabled={isExporting} onClick={() => void exportReport()}>
          {t('exportReport.action.exportJson')}
        </Button>
      </div>
      <div className="col-span-2">
        <EmptyReportConfigForm />
      </div>
    </>
  )
}

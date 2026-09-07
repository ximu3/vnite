import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { defaultReportExportOptions } from '@appTypes/report'
import { Button } from '@ui/button'
import { ipcManager } from '~/app/ipc'
import { useTheme } from '~/components/ThemeProvider'
import { useConfigLocalState } from '~/hooks'
import { useAttachmentStore } from '~/stores'
import { useGameRegistry, useNSFWFilteredGameIds } from '~/stores/game'
import { createScoreReportCategories } from '../../ScoreReport/data'
import { useScoreReportStore } from '../../store'
import { ReportExportSettingsForm } from '../settings'
import type { ReportGeneratorProps } from '../types'
import { createReportThemeCss } from '../utils'
import {
  collectScoreReportText,
  createScoreReportExportModel,
  inlineScoreReportAssets
} from './model'
import { ScoreReportExportSettings } from './settings'
import { buildScoreReportDocument } from './template'

export function ScoreReportGenerator({
  outputPath,
  isExporting,
  resolveOutputPath,
  onExportingChange
}: ReportGeneratorProps): React.JSX.Element {
  const { t, i18n } = useTranslation('record')
  const { isDark } = useTheme()
  const [scoreReportOptions, setScoreReportOptions] = useConfigLocalState(
    'report.reports.scoreReport'
  )
  const scoreReportVersion = useScoreReportStore((state) => state.scoreReportVersion)
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const attachments = useAttachmentStore((state) => state.attachments)
  const filteredGameIds = useNSFWFilteredGameIds()

  const categories = useMemo(
    () => createScoreReportCategories(t, filteredGameIds, gameMetaIndex),
    [t, filteredGameIds, gameMetaIndex, scoreReportVersion]
  )
  const reportModel = useMemo(
    () =>
      createScoreReportExportModel(
        t,
        i18n.resolvedLanguage ?? i18n.language,
        categories,
        gameMetaIndex,
        attachments
      ),
    [t, i18n.resolvedLanguage, i18n.language, categories, gameMetaIndex, attachments]
  )
  const hasScoredGames = reportModel.categories.length > 0

  const resetExportOptions = (): void => {
    void setScoreReportOptions(defaultReportExportOptions.reports.scoreReport)
  }

  const exportReport = async (): Promise<void> => {
    if (!hasScoredGames || isExporting) return

    const resolvedOutputPath = outputPath || (await resolveOutputPath())
    if (!resolvedOutputPath) return

    onExportingChange(true)
    const exportPromise = (async () => {
      const modelWithInlineAssets = await inlineScoreReportAssets(
        reportModel,
        scoreReportOptions.coverWidth
      )
      const themeCss = createReportThemeCss(scoreReportOptions.theme, isDark)
      const font = await ipcManager.invoke(
        'report:create-font-subset',
        collectScoreReportText(modelWithInlineAssets)
      )
      const html = buildScoreReportDocument({
        model: modelWithInlineAssets,
        options: scoreReportOptions,
        themeCss,
        fontSource: font.dataUrl
      })
      return await ipcManager.invoke('report:export', {
        reportType: 'scoreReport',
        format: 'html',
        outputPath: resolvedOutputPath,
        html
      })
    })().finally(() => onExportingChange(false))

    toast.promise(exportPromise, {
      loading: t('exportReport.message.loading.html'),
      success: (result) => t('exportReport.message.success', { file: result.outputFile }),
      error: (error) =>
        `${t('exportReport.message.error')}: ${error instanceof Error ? error.message : String(error)}`
    })
  }

  return (
    <>
      <div className="flex justify-end gap-2 ml-4">
        <Button
          variant="secondary"
          disabled={!hasScoredGames || isExporting}
          onClick={resetExportOptions}
        >
          {t('exportReport.action.reset')}
        </Button>
        <Button disabled={!hasScoredGames || isExporting} onClick={() => void exportReport()}>
          {t('exportReport.action.exportHtml')}
        </Button>
      </div>

      <div className="col-span-2">
        {!hasScoredGames && (
          <div className="mt-4 mb-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t('exportReport.emptyScoreReport')}
          </div>
        )}
        <ReportExportSettingsForm>
          <ScoreReportExportSettings />
        </ReportExportSettingsForm>
      </div>
    </>
  )
}

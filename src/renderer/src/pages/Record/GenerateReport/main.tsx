import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import type { ReportType } from '@appTypes/report'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState } from '~/hooks'
import { GamePlayTimeReportGenerator } from './GamePlayTime'
import { ScoreReportGenerator } from './ScoreReport'

export function GenerateReport(): React.JSX.Element {
  const { t } = useTranslation('record')
  const [selectedReport, setSelectedReport] = useState<ReportType>('scoreReport')
  const [isExporting, setIsExporting] = useState(false)
  const [outputPath, setOutputPath] = useConfigLocalState('report.common.outputPath')

  async function selectOutputPath(): Promise<string | undefined> {
    try {
      const selectedPath = await ipcManager.invoke(
        'system:select-path-dialog',
        ['openDirectory'],
        undefined,
        outputPath
      )
      if (!selectedPath) return undefined

      await setOutputPath(selectedPath)
      return selectedPath
    } catch (error) {
      toast.error(
        `${t('exportReport.message.error')}: ${error instanceof Error ? error.message : String(error)}`
      )
      return undefined
    }
  }

  const generatorProps = {
    outputPath,
    isExporting,
    resolveOutputPath: selectOutputPath,
    onExportingChange: setIsExporting
  }

  return (
    <>
      <div className="grid grid-cols-[13rem_minmax(0,1fr)] items-center">
        <Select
          value={selectedReport}
          onValueChange={(value) => setSelectedReport(value as ReportType)}
        >
          <SelectTrigger className="w-52" aria-label={t('exportReport.preset.label')}>
            <SelectValue placeholder={t('exportReport.preset.label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('exportReport.preset.groups.report')}</SelectLabel>
              <SelectItem value="scoreReport">{t('exportReport.preset.scoreReport')}</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>{t('exportReport.preset.groups.json')}</SelectLabel>
              <SelectItem value="gamePlayTime">{t('exportReport.preset.gamePlayTime')}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {selectedReport === 'scoreReport' ? (
          <ScoreReportGenerator {...generatorProps} />
        ) : selectedReport === 'gamePlayTime' ? (
          <GamePlayTimeReportGenerator {...generatorProps} />
        ) : null}
      </div>

      <div className="flex mt-4 gap-3">
        <Button variant="outline" size="icon" onClick={() => void selectOutputPath()}>
          <span className="icon-[mdi--folder-outline] w-5 h-5" />
        </Button>
        <Input
          className="items-center"
          placeholder={t('exportReport.outputPath')}
          value={outputPath}
          readOnly
        />
      </div>
    </>
  )
}

import { posterUISchemas, type TemplatePayloads } from '@appTypes/poster'
import type { ReportPresetId } from '@appTypes/report'
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useConfigState } from '~/hooks'
import { useNSFWFilteredGameIds } from '~/stores/game'
import { invokePosterRender } from '~/utils'
import { exportGamePlayTimeReport } from '~/utils/report'
import { ConfigForm } from '../Config/GeneratePosterForm'
import { usePosterTemplateStore } from '../store'

const PRESET_CONFIG_TEMPLATES = {
  posterScoreReport: 'scoreReport',
  jsonGamePlayTime: null
} as const satisfies Record<ReportPresetId, keyof TemplatePayloads | null>

function assertNever(value: never): never {
  throw new Error(`Unknown report preset: ${String(value)}`)
}

function PresetConfigForm({ preset }: { preset: ReportPresetId }): React.JSX.Element {
  switch (preset) {
    case 'posterScoreReport':
      return <ConfigForm template="scoreReport" schema={posterUISchemas.scoreReport} />
    case 'jsonGamePlayTime':
      return <ConfigForm template="_empty_" />
    default:
      return assertNever(preset)
  }
}

export function GenerateReport(): React.JSX.Element {
  const { t } = useTranslation('record')

  const [selectedPreset, setSelectedPreset] = useState<ReportPresetId>('posterScoreReport')
  const payload = usePosterTemplateStore((s) => s.payloads['scoreReport'])
  const renderOptions = usePosterTemplateStore((s) => s.renderOptions)
  const setRenderOption = usePosterTemplateStore((s) => s.setRenderOption)
  const resetPayload = usePosterTemplateStore((s) => s.resetPayload)
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const filteredGameIds = useNSFWFilteredGameIds()
  const selectedConfigTemplate = PRESET_CONFIG_TEMPLATES[selectedPreset]

  const handleExport = (): void => {
    if (!renderOptions.outputPath) return

    let exportPromise: Promise<{ outputFile: string }>

    switch (selectedPreset) {
      case 'posterScoreReport':
        exportPromise = invokePosterRender('scoreReport', payload, renderOptions, {
          includedGameIds: filteredGameIds
        })
        break
      case 'jsonGamePlayTime':
        exportPromise = exportGamePlayTimeReport(
          renderOptions.outputPath,
          filteredGameIds,
          nsfwFilterMode
        )
        break
      default:
        return assertNever(selectedPreset)
    }

    toast.promise(exportPromise, {
      loading: t('exportReport.message.loading'),
      success: (result) => t('exportReport.message.success', { file: result.outputFile }),
      error: t('exportReport.message.error')
    })
  }

  function selectGamePath(): void {
    ipcManager
      .invoke('system:select-path-dialog', ['openDirectory'], undefined, renderOptions.outputPath)
      .then((selectedPath) => {
        if (selectedPath) setRenderOption('outputPath', selectedPath)
      })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2 flex-1 max-w-[75%]">
          <Select
            value={selectedPreset}
            onValueChange={(value) => setSelectedPreset(value as ReportPresetId)}
          >
            <SelectTrigger className="w-52" aria-label={t('exportReport.preset.label')}>
              <SelectValue placeholder={t('exportReport.preset.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('exportReport.preset.groups.poster')}</SelectLabel>
                <SelectItem value="posterScoreReport">
                  {t('exportReport.preset.posterScoreReport')}
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>{t('exportReport.preset.groups.json')}</SelectLabel>
                <SelectItem value="jsonGamePlayTime">
                  {t('exportReport.preset.jsonGamePlayTime')}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2 ml-4">
          {selectedConfigTemplate && (
            <Button variant="secondary" onClick={() => resetPayload(selectedConfigTemplate)}>
              {t('exportReport.action.reset')}
            </Button>
          )}
          <Button disabled={!renderOptions.outputPath} onClick={handleExport}>
            {t('exportReport.action.export')}
          </Button>
        </div>
      </div>
      <PresetConfigForm preset={selectedPreset} />
      <div className="flex mt-4 gap-3">
        <Button variant="outline" size="icon" onClick={selectGamePath}>
          <span className="icon-[mdi--folder-outline] w-5 h-5"></span>
        </Button>
        <Input
          className="items-center"
          placeholder={t('exportReport.outputPath')}
          value={renderOptions.outputPath}
          readOnly
        />
      </div>
    </>
  )
}

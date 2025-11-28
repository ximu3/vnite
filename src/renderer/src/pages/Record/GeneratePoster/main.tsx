import { posterUISchemas } from '@appTypes/poster'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { invokePosterRender } from '~/utils'
import { ConfigForm } from '../Config/GeneratePosterForm'
import { usePosterTemplateStore } from '../store'

export function GenerateReport(): React.JSX.Element {
  const { t } = useTranslation('record')

  const payload = usePosterTemplateStore((s) => s.payloads['scoreReport'])
  const renderOptions = usePosterTemplateStore((s) => s.renderOptions)
  const setRenderOption = usePosterTemplateStore((s) => s.setRenderOption)
  const resetScoreReport = usePosterTemplateStore((s) => s.resetPayload)

  const handleRender = async (): Promise<void> => {
    toast.promise(invokePosterRender('scoreReport', payload, renderOptions), {
      loading: t('poster.message.loading'),
      success: (result) => t('poster.message.success', { file: result.outputFile }),
      error: t('poster.message.error')
    })
  }
  const handleReset = (): void => {
    resetScoreReport('scoreReport')
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
        <div className="flex space-x-2 flex-1 max-w-[60%]">
          <Input
            className="flex-1"
            placeholder={t('poster.renderOptions.outputPath')}
            value={renderOptions.outputPath}
            aria-invalid={!renderOptions.outputPath}
            readOnly
          />
          <Button variant="outline" size="icon" onClick={selectGamePath}>
            <span className="icon-[mdi--folder-outline] w-5 h-5"></span>
          </Button>
        </div>

        <div className="flex space-x-2 ml-4">
          <Button onClick={handleRender}>{t('poster.action.render')}</Button>
          <Button variant="secondary" onClick={handleReset}>
            {t('poster.action.reset')}
          </Button>
        </div>
      </div>
      <ConfigForm template="scoreReport" schema={posterUISchemas.scoreReport}></ConfigForm>
    </>
  )
}

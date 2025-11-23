import { posterUISchemas } from '@appTypes/poster'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { invokePosterRender } from '~/utils'
import { ConfigForm } from '../Config/GeneratePosterForm'
import { usePosterTemplateStore } from '../store'

export function GenerateReport(): React.JSX.Element {
  const { t } = useTranslation('record')

  const payload = usePosterTemplateStore((s) => s.payloads['scoreReport'])
  const resetScoreReport = usePosterTemplateStore((s) => s.resetPayload)

  const handleRender = async (): Promise<void> => {
    toast.promise(invokePosterRender('scoreReport', payload), {
      loading: t('poster._message.loading'),
      success: (result) => t('poster._message.success', { file: result.outputFile }),
      error: t('poster._message.error')
    })
  }
  const handleReset = (): void => {
    resetScoreReport('scoreReport')
  }

  return (
    <>
      <div className="flex space-x-2 mb-4">
        <Button onClick={handleRender}>{t('poster._action.render')}</Button>
        <Button variant="secondary" onClick={handleReset}>
          {t('poster._action.reset')}
        </Button>
      </div>
      <ConfigForm template="scoreReport" schema={posterUISchemas.scoreReport}></ConfigForm>
    </>
  )
}

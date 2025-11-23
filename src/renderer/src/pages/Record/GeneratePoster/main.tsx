import { posterUISchemas } from '@appTypes/poster'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { invokePosterRender } from '~/utils'
import { ConfigForm } from '../Config/GeneratePosterForm'
import { usePosterTemplateStore } from '../store'

export function GenerateReport(): React.JSX.Element {
  // const { t } = useTranslation('record')

  const payload = usePosterTemplateStore((s) => s.payloads['scoreReport'])
  const resetScoreReport = usePosterTemplateStore((s) => s.resetPayload)

  const handleRender = async (): Promise<void> => {
    toast.promise(invokePosterRender('scoreReport', payload), {
      loading: 'Rendering...',
      success: (result) => `Rendered successfully: ${result.outputFile}`,
      error: 'Rendering failed'
    })
  }
  const handleReset = (): void => {
    resetScoreReport('scoreReport')
  }

  return (
    <>
      <div className="flex space-x-2 mb-4">
        <Button onClick={handleRender}>Render Poster</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>
      <ConfigForm template="scoreReport" schema={posterUISchemas.scoreReport}></ConfigForm>
    </>
  )
}

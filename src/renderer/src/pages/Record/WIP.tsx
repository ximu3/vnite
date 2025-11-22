import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { invokePosterRender } from '~/utils'

// Main Scoring Report Component
export function WIP(): React.JSX.Element {
  // const { t } = useTranslation('record')

  const a = async (): Promise<void> => {
    toast.promise(invokePosterRender('test', { title: '11', subtitle: '22' }), {
      loading: '1',
      success: '2',
      error: (_err) => '3'
    })
  }

  return (
    <div className="space-y-6">
      <Button onClick={a}>1111</Button>
    </div>
  )
}

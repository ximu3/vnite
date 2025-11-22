import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'

// Main Scoring Report Component
export function WIP(): React.JSX.Element {
  // const { t } = useTranslation('record')

  const a = async (): Promise<void> => {
    toast.promise(
      ipcManager.invoke('poster:render', {
        id: 'test',
        payload: { title: '11', subntitle: '22' },
        options: { outputPath: 'C:/Users/zj/Downloads' }
      }),
      {
        loading: '1',
        success: '2',
        error: (err) => '3'
      }
    )
  }

  return (
    <div className="space-y-6">
      <Button onClick={a}>1111</Button>
    </div>
  )
}

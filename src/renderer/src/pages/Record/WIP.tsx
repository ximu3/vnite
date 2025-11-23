import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { ColorPicker } from '~/components/ui/color-picker'
import { invokePosterRender } from '~/utils'

// Main Scoring Report Component
export function WIP(): React.JSX.Element {
  // const { t } = useTranslation('record')
  const [color, setColor] = useState('red')

  const a = async (): Promise<void> => {
    toast.promise(
      invokePosterRender('scoreReport', {
        maxWidth: 1600,
        titleWidth: 10,
        gameCoverHeightLarge: 300,
        gameCoverHeightSmall: 210,
        padding: 10,
        gap: 10
      }),
      {
        loading: '1',
        success: '2',
        error: (_err) => '3'
      }
    )
  }

  return (
    <div className="space-y-6">
      <Button onClick={a}>1111</Button>
      <ColorPicker value={color} onChange={setColor}></ColorPicker>
    </div>
  )
}

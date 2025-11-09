import { SettingsPopover } from '@ui/popover'
import { Slider } from '@ui/slider'
import { useCallback, useState } from 'react'

interface MergeIntervalSliderPopoverProps {
  initialValue: number
  min: number
  max: number
  step: number
  title: string
  onCommit: (newInterval: number) => void
}

export const MergeIntervalSliderPopover: React.FC<MergeIntervalSliderPopoverProps> = ({
  initialValue,
  min,
  max,
  step,
  title,
  onCommit
}: MergeIntervalSliderPopoverProps) => {
  const [displayValue, setDisplayValue] = useState(initialValue)

  const handleSliderChange = useCallback((value: number[]) => {
    setDisplayValue(value[0])
  }, [])

  const handleSliderCommit = useCallback(
    (value: number[]) => {
      const newValue = value[0]
      setDisplayValue(newValue)
      onCommit(newValue)
    },
    [onCommit]
  )

  return (
    <SettingsPopover>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex justify-between gap-2">
          <Slider
            value={[displayValue]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            className="w-48"
          />
          <span className="text-sm text-muted-foreground text-right ml-1">
            {`${displayValue} min`}
          </span>
        </div>
      </div>
    </SettingsPopover>
  )
}

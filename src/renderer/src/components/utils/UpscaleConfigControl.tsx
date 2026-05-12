import { getUpscalerBackendByPath } from '@appTypes/utils'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Label } from '@ui/label'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigLocalState } from '~/hooks'
import { cn } from '~/utils'
import { UpscalerConfigDialog } from './UpscalerConfigDialog'

interface UpscaleConfigControlProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  className?: string
  disabled?: boolean
}

export function UpscaleConfigControl({
  checked,
  onCheckedChange,
  label,
  className,
  disabled = false
}: UpscaleConfigControlProps): React.JSX.Element {
  const { t } = useTranslation('config')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [upscalerPath] = useConfigLocalState('game.linkage.upscaler.path')
  const checkboxId = React.useId()
  const hasRecognizedBackend = getUpscalerBackendByPath(upscalerPath) !== null
  const checkboxDisabled = disabled || !hasRecognizedBackend

  React.useEffect(() => {
    if (!hasRecognizedBackend && checked) {
      onCheckedChange(false)
    }
  }, [checked, hasRecognizedBackend, onCheckedChange])

  return (
    <>
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
            disabled={checkboxDisabled}
          />
          <Label
            htmlFor={checkboxId}
            className={cn(
              'cursor-pointer whitespace-nowrap',
              checkboxDisabled && 'cursor-not-allowed text-muted-foreground'
            )}
          >
            {label}
          </Label>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="w-7 h-7"
          onClick={() => setDialogOpen(true)}
          title={t('advanced.upscaler.configure')}
          disabled={disabled}
        >
          <span className="icon-[mdi--cog] w-4 h-4"></span>
        </Button>
      </div>

      <UpscalerConfigDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}

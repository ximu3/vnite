import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { Slider } from '@ui/slider'
import { useTranslation } from 'react-i18next'

interface UpscaleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  scale: number
  onScaleChange: (scale: number) => void
  onConfirm: () => void
  isSubmitting?: boolean
}

export function UpscaleDialog({
  isOpen,
  onOpenChange,
  scale,
  onScaleChange,
  onConfirm,
  isSubmitting = false
}: UpscaleDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px]">
        <DialogHeader className="mb-4">
          <DialogTitle>{t('detail.properties.media.upscale.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-3">
            <Slider
              min={2}
              max={4}
              step={1}
              value={[scale]}
              onValueChange={([value]) => {
                if (typeof value === 'number') {
                  onScaleChange(value)
                }
              }}
            />

            <div className="flex justify-between px-1 text-xs text-muted-foreground">
              <span>2x</span>
              <span>3x</span>
              <span>4x</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('utils:common.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {t('utils:common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

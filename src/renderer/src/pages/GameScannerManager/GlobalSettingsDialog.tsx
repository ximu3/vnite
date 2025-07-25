import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { useConfigLocalState } from '~/hooks'
import { ArrayTextarea } from '@ui/array-textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { cn } from '~/utils'
import { useGameScannerStore } from './store'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'

interface GlobalSettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const GlobalSettingsDialog: React.FC<GlobalSettingsDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('scanner')
  const [scannerConfig, setScannerConfig] = useConfigLocalState('game.scanner')
  const { globalSettings, intervalMinutes, updateGlobalSettings, updateIntervalMinutes } =
    useGameScannerStore()

  // Initialize form data
  useEffect(() => {
    if (isOpen && scannerConfig) {
      // Initialize global settings
      updateGlobalSettings({
        interval: scannerConfig.interval || 0,
        ignoreList: scannerConfig.ignoreList || []
      })
      updateIntervalMinutes(((scannerConfig.interval || 0) / 60000).toString())
    }
  }, [isOpen, scannerConfig, updateGlobalSettings, updateIntervalMinutes])

  // Save global settings
  const handleSave = async (): Promise<void> => {
    if (globalSettings.interval < 5 * 60 * 1000) {
      toast.error(t('notifications.intervalTooShort'))
      return
    }
    const updatedConfig = {
      ...scannerConfig,
      interval: globalSettings.interval,
      ignoreList: globalSettings.ignoreList
    }
    await setScannerConfig(updatedConfig)
    await ipcManager.invoke('scanner:start-periodic-scan')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('globalSettings.title')}</DialogTitle>
        </DialogHeader>

        <div
          className={cn('grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 py-5 items-center text-sm')}
        >
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('globalSettings.scanInterval')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <Input
                type="text"
                value={intervalMinutes}
                onChange={(e) => updateIntervalMinutes(e.target.value)}
                className={cn('text-sm')}
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <div className={cn('text-xs')}>{t('globalSettings.scanIntervalTooltip')}</div>
            </TooltipContent>
          </Tooltip>

          <div className={cn('whitespace-nowrap select-none self-start mt-1')}>
            {t('globalSettings.ignoreList')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayTextarea
                className="h-[100px] resize-none"
                placeholder={t('globalSettings.ignoreListPlaceholder')}
                value={globalSettings.ignoreList}
                onChange={(value: string[]) => updateGlobalSettings({ ignoreList: value })}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <div className={cn('text-xs')}>{t('globalSettings.ignoreListTooltip')}</div>
            </TooltipContent>
          </Tooltip>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

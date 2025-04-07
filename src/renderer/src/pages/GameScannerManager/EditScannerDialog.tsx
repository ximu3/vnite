import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@ui/dialog'
import { Input } from '@ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { Button } from '@ui/button'
import { useConfigLocalState } from '~/hooks'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { cn } from '~/utils'
import { useGameScannerStore } from './store'

interface EditScannerDialogProps {
  isOpen: boolean
  onClose: () => void
  scannerId: string | null
  isNew: boolean
}

export const EditScannerDialog: React.FC<EditScannerDialogProps> = ({
  isOpen,
  onClose,
  scannerId,
  isNew
}) => {
  const { t } = useTranslation('scanner')
  const [scannerConfig, setScannerConfig] = useConfigLocalState('game.scanner')
  const { formState, initFormState, updateFormState, selectPath, createNewScanner } =
    useGameScannerStore()

  // Initialize form data
  useEffect(() => {
    if (!isNew && scannerConfig?.list && scannerId && scannerConfig.list[scannerId]) {
      // Edit existing scanner
      initFormState(scannerConfig.list[scannerId], false)
    } else if (isNew) {
      // Create new scanner
      initFormState(null, true)
    }
  }, [isNew, scannerId, scannerConfig, initFormState])

  // Save scanner configuration
  const handleSave = async (): Promise<void> => {
    if (isNew) {
      // Create new scanner
      await createNewScanner(formState)
    } else if (scannerId && scannerConfig) {
      // Update existing scanner
      const updatedConfig = {
        ...scannerConfig,
        list: {
          ...scannerConfig.list,
          [scannerId]: formState
        }
      }
      await setScannerConfig(updatedConfig)
    }

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('editScanner.addTitle') : t('editScanner.editTitle')}
          </DialogTitle>
        </DialogHeader>

        <div
          className={cn('grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 py-5 items-center text-sm')}
        >
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.path')}
          </div>
          <div className={cn('flex gap-2')}>
            <Input
              onChange={(e) => updateFormState({ path: e.target.value })}
              value={formState.path}
              className={cn('flex-grow text-sm')}
              placeholder={t('editScanner.pathPlaceholder')}
            />
            <Button type="button" onClick={selectPath}>
              {t('actions.browse')}
            </Button>
          </div>

          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.dataSource')}
          </div>
          <Select
            value={formState.dataSource}
            onValueChange={(value: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite') =>
              updateFormState({ dataSource: value })
            }
          >
            <SelectTrigger className={cn('w-full text-sm')}>
              <SelectValue placeholder={t('editScanner.dataSourcePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="steam">{t('dataSources.steam')}</SelectItem>
              <SelectItem value="vndb">{t('dataSources.vndb')}</SelectItem>
              <SelectItem value="bangumi">{t('dataSources.bangumi')}</SelectItem>
              <SelectItem value="ymgal">{t('dataSources.ymgal')}</SelectItem>
              <SelectItem value="igdb">{t('dataSources.igdb')}</SelectItem>
              <SelectItem value="dlsite">{t('dataSources.dlsite')}</SelectItem>
            </SelectContent>
          </Select>

          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.scanDepth')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <Select
                value={formState.depth.toString()}
                onValueChange={(value) =>
                  updateFormState({
                    depth: parseInt(value)
                  })
                }
              >
                <SelectTrigger className={cn('w-full text-sm')}>
                  <SelectValue placeholder={t('editScanner.depthPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{t('editScanner.depthTooltip')}</div>
            </TooltipContent>
          </Tooltip>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!formState.path}>
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

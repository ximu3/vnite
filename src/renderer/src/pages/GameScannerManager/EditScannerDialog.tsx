import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { useConfigLocalState } from '~/hooks'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { cn } from '~/utils'
import { useGameScannerStore } from './store'
import { ScraperCapabilities } from '@appTypes/utils'
import { ipcManager } from '~/app/ipc'
import { toast } from 'sonner'

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

  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const sources = await ipcManager.invoke('scraper:get-provider-infos-with-capabilities', [
        'searchGames',
        'checkGameExists',
        'getGameMetadata',
        'getGameBackgrounds',
        'getGameCovers'
      ])
      setAvailableDataSources(sources)
      if (sources.length > 0) {
        if (!sources.some((ds) => ds.id === formState.dataSource)) {
          updateFormState({ dataSource: sources[0].id })
        }
      } else {
        toast.error(t('gameBatchAdder.notifications.noDataSources'))
      }
    }
    fetchAvailableDataSources()
  }, [])

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
      <DialogContent className="w-[500px]">
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
          <div className={cn('flex flex-row gap-2')}>
            <Input
              onChange={(e) => updateFormState({ path: e.target.value })}
              value={formState.path}
              className={cn('text-sm flex-1')}
              placeholder={t('editScanner.pathPlaceholder')}
            />
            <Button className="" size={'icon'} variant={'outline'} onClick={selectPath}>
              <span className={cn('icon-[mdi--folder-open-outline] w-5 h-5')}></span>
            </Button>
          </div>

          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.dataSource')}
          </div>
          <Select
            value={formState.dataSource}
            onValueChange={(
              value: 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite' | string
            ) => updateFormState({ dataSource: value })}
          >
            <SelectTrigger className={cn('w-full text-sm')}>
              <SelectValue placeholder={t('editScanner.dataSourcePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {availableDataSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
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

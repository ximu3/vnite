import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '~/components/ui/dialog'
import { Input, StepperInput } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { useConfigLocalState } from '~/hooks'
import { cn } from '~/utils'
import { useGameScannerStore } from './store'
import { ScraperCapabilities } from '@appTypes/utils'
import { ipcManager } from '~/app/ipc'
import { toast } from 'sonner'
import { useGameCollectionStore } from '~/stores'
import { Switch } from '~/components/ui/switch'

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

  const checkCollectionExists = useGameCollectionStore((state) => state.checkCollectionExists)
  const getAllCollections = useGameCollectionStore((state) => state.getAllCollections)
  const collections = getAllCollections()

  useEffect(() => {
    // Check if the target collection exists
    if (formState.targetCollection && !checkCollectionExists(formState.targetCollection)) {
      // Reset to 'none' if it doesn't exist
      updateFormState({ targetCollection: 'none' })
    }
  }, [formState.targetCollection, checkCollectionExists, updateFormState])

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
          {/* Path */}
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
          {/* Data Source */}
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
          {/* Scan Mode */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.scanMode', { defaultValue: 'Scan Mode' })}
          </div>
          <Select
            value={formState.scanMode}
            onValueChange={(value: 'auto' | 'hierarchy' | string) =>
              updateFormState({ scanMode: value === 'hierarchy' ? 'hierarchy' : 'auto' })
            }
          >
            <SelectTrigger className={cn('w-full text-sm')}>
              <SelectValue
                placeholder={t('editScanner.scanModePlaceholder', {
                  defaultValue: 'Select scan mode'
                })}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                {t('editScanner.scanModes.auto', { defaultValue: 'Auto (by executables)' })}
              </SelectItem>
              <SelectItem value="hierarchy">
                {t('editScanner.scanModes.hierarchy', { defaultValue: 'Hierarchy (by level)' })}
              </SelectItem>
            </SelectContent>
          </Select>
          {/* Hierarchy Level */}
          {formState.scanMode === 'hierarchy' && (
            <>
              <div className={cn('whitespace-nowrap select-none justify-self-start')}>
                {t('editScanner.hierarchyLevel', { defaultValue: 'Hierarchy Level' })}
              </div>
              <div className={cn('flex flex-col gap-1')}>
                <StepperInput
                  min={0}
                  step={1}
                  steps={{ default: 1, shift: 10 }}
                  value={formState.hierarchyLevel ?? 0}
                  onChange={(e) => {
                    const next = Math.max(0, Math.floor(Number(e.target.value) || 0))
                    updateFormState({ hierarchyLevel: next })
                  }}
                  inputClassName={cn('text-sm')}
                  placeholder={t('editScanner.hierarchyLevelPlaceholder', { defaultValue: '0' })}
                />
                <div className={cn('text-xs text-muted-foreground select-none')}>
                  {t('editScanner.hierarchyLevelHelp', {
                    defaultValue:
                      'Default 0: the first-level subfolder under Path is treated as the game folder.'
                  })}
                </div>
              </div>
            </>
          )}
          {/* Target Collection */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.targetCollection')}
          </div>
          <Select
            value={formState.targetCollection}
            onValueChange={(value) => updateFormState({ targetCollection: value })}
          >
            <SelectTrigger className={cn('text-sm w-full')}>
              <SelectValue placeholder={t('editScanner.targetCollectionPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('editScanner.targetCollectionNone')}</SelectItem>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  {collection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Normalize Folder Name */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('editScanner.normalizeFolderName')}
          </div>
          <Switch
            checked={formState.normalizeFolderName}
            onCheckedChange={(checked) =>
              updateFormState({ normalizeFolderName: Boolean(checked) })
            }
          ></Switch>
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

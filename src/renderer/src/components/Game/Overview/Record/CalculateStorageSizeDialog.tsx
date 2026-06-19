import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@ui/dialog'
import { StepperInput } from '@ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { ipcManager } from '~/app/ipc'
import { useGameLocalState, useGameState } from '~/hooks'
import { formatStorageSize } from '~/utils'

type SizeUnit = 'mib' | 'gib'

const MIB_TO_BYTES = 1024 * 1024
const GIB_TO_BYTES = 1024 * 1024 * 1024

function formatDisplayValue(bytes: number, unit: SizeUnit): string {
  if (bytes < 0) return ''

  const value = bytes / (unit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES)
  if (!Number.isFinite(value)) return ''
  if (value === 0) return '0'

  return String(Number(value.toFixed(4)))
}

export function CalculateStorageSizeDialog({
  gameId,
  isOpen,
  setIsOpen
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [rootPath] = useGameLocalState(gameId, 'utils.rootPath')
  const [draftStorageSize, setDraftStorageSize, saveDraftStorageSize] = useGameState(
    gameId,
    'record.storageSize',
    true
  )
  const [manualUnit, setManualUnit] = useState<SizeUnit>(
    draftStorageSize >= GIB_TO_BYTES ? 'gib' : 'mib'
  )

  const [isCalculating, setIsCalculating] = useState(false)
  const autoCalculationAvailable = rootPath !== ''

  const handleCalculate = async (): Promise<void> => {
    if (!autoCalculationAvailable || isCalculating) {
      return
    }

    setIsCalculating(true)
    const calculatePromise = ipcManager
      .invoke('game:calculate-storage-size', gameId)
      .then((size) => {
        if (size < 0) {
          throw new Error('storage-size-not-calculated')
        }

        return size
      })

    toast.promise(calculatePromise, {
      loading: t('detail.manage.notifications.calculatingStorageSize'),
      success: (size) => {
        setIsOpen(false)
        return t('detail.manage.notifications.storageSizeCalculated', {
          size: formatStorageSize(size)
        })
      },
      error: t('detail.manage.notifications.storageSizeError')
    })

    try {
      await calculatePromise
    } catch {
      // toast.promise already handles the user-facing error state.
    } finally {
      setIsCalculating(false)
    }
  }

  const handleManualSave = async (): Promise<void> => {
    if (isCalculating) {
      return
    }

    if (draftStorageSize < 0) {
      toast.error(t('detail.manage.notifications.storageSizeNegative'))
      return
    }

    try {
      await saveDraftStorageSize()
      toast.success(
        t('detail.manage.notifications.storageSizeSaved', {
          size: formatStorageSize(draftStorageSize)
        })
      )
      setIsOpen(false)
    } catch {
      toast.error(t('detail.manage.notifications.storageSizeSaveError'))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[560px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>{t('detail.manage.storageSizeDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 rounded-md border p-4">
            <div className="font-medium">{t('detail.manage.storageSizeDialog.autoTitle')}</div>
            <div className="text-sm text-muted-foreground">
              {autoCalculationAvailable
                ? t('detail.manage.storageSizeDialog.autoDescription')
                : t('detail.manage.storageSizeDialog.autoUnavailable')}
            </div>
            <Button
              className="self-start mt-2"
              onClick={() => void handleCalculate()}
              disabled={!autoCalculationAvailable || isCalculating}
            >
              {t('detail.manage.calculateStorageSize')}
            </Button>
          </div>

          <div className="flex flex-col gap-1 rounded-md border p-4">
            <div className="font-medium">{t('detail.manage.storageSizeDialog.manualTitle')}</div>
            <div className="text-sm text-muted-foreground">
              {t('detail.manage.storageSizeDialog.manualDescription')}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <StepperInput
                min={0}
                value={formatDisplayValue(draftStorageSize, manualUnit)}
                steps={
                  manualUnit === 'gib'
                    ? { default: 0.1, shift: 1, alt: 10, ctrl: 100 }
                    : { default: 128, shift: 512, alt: 1024, ctrl: 10240 }
                }
                placeholder={t('detail.manage.storageSizeDialog.manualInputPlaceholder')}
                onChange={(e) =>
                  setDraftStorageSize(
                    Math.round(
                      Number(e.target.value) * (manualUnit === 'gib' ? GIB_TO_BYTES : MIB_TO_BYTES)
                    )
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void handleManualSave()
                  }
                }}
                disabled={isCalculating}
                className="w-80"
              />
              <Select
                value={manualUnit}
                onValueChange={(value) => setManualUnit(value as SizeUnit)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mib">{t('filter.panel.mib')}</SelectItem>
                  <SelectItem value="gib">{t('filter.panel.gib')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('utils:common.cancel')}
          </Button>
          <Button onClick={() => void handleManualSave()} disabled={isCalculating}>
            {t('utils:common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

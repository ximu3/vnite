import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameLocalState } from '~/hooks'
import { ipcManager } from '~/app/ipc'
import { toast } from 'sonner'
import { formatStorageSize } from '~/utils'
import { getGameStore } from '~/stores/game/gameStoreFactory'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'

export function ModifyRootPathDialog({
  gameId,
  isOpen,
  setIsOpen
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [rootPath, setRootPath] = useGameLocalState(gameId, 'utils.rootPath')
  const [newRootPath, setNewRootPath] = useState(rootPath ?? '')
  const [recalculateSize, setRecalculateSize] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setNewRootPath(rootPath)
      setRecalculateSize(true)
    }
  }, [rootPath, isOpen])

  const handleSelectDirectory = async (): Promise<void> => {
    const selectedPath = await ipcManager.invoke(
      'system:select-path-dialog',
      ['openDirectory'],
      undefined,
      newRootPath || rootPath
    )
    if (selectedPath) {
      setNewRootPath(selectedPath)
    }
  }

  const handleCalculateStorageSize = (): void => {
    toast.promise(ipcManager.invoke('game:calculate-storage-size', gameId), {
      loading: t('detail.manage.notifications.calculatingStorageSize'),
      success: (size: number) => {
        if (size < 0) {
          throw new Error('Calculation failed')
        }
        getGameStore(gameId).getState().setValue('record.storageSize', size)
        return t('detail.manage.notifications.storageSizeCalculated', {
          size: formatStorageSize(size)
        })
      },
      error: () => t('detail.manage.notifications.storageSizeError')
    })
  }

  const handleConfirm = async (): Promise<void> => {
    if (!newRootPath) return
    if (newRootPath !== rootPath) {
      await setRootPath(newRootPath)
      if (recalculateSize) {
        handleCalculateStorageSize()
      }
    }
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('detail.manage.modifyRootPath')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 py-4">
          <span className="text-sm text-muted-foreground truncate">{newRootPath}</span>
          <Button variant="outline" size="sm" onClick={handleSelectDirectory}>
            {t('detail.manage.selectDirectory')}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={recalculateSize}
            onCheckedChange={(checked) => setRecalculateSize(checked === true)}
          />
          <span className="text-sm">{t('detail.manage.recalculateStorageSize')}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('utils:common.cancel')}
          </Button>
          <Button disabled={!newRootPath} onClick={handleConfirm}>
            {t('utils:common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { ipcManager } from '~/app/ipc'
import { toast } from 'sonner'
import { formatStorageSize } from '~/utils'
import { STORAGE_SIZE_NOT_CALCULATED } from '@appTypes/models/game'
import { getGameStore } from '~/stores/game/gameStoreFactory'

export function CalculateStorageSizeAlertDialog({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [storageSize] = useGameState(gameId, 'record.storageSize')

  const handleCalculate = (): void => {
    toast.promise(ipcManager.invoke('game:calculate-storage-size', gameId), {
      loading: t('detail.manage.notifications.calculatingStorageSize'),
      success: (size: number) => {
        if (size < 0) {
          throw new Error('Calculation failed')
        }
        // Update the store with the new size
        getGameStore(gameId).getState().setValue('record.storageSize', size)
        return t('detail.manage.notifications.storageSizeCalculated', {
          size: formatStorageSize(size)
        })
      },
      error: () => t('detail.manage.notifications.storageSizeError')
    })
  }

  const hasCalculatedSize = storageSize !== STORAGE_SIZE_NOT_CALCULATED && storageSize !== undefined

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('detail.manage.calculateStorageSize')}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasCalculatedSize
              ? t('detail.manage.notifications.storageSizeRecalculateConfirm', {
                  currentSize: formatStorageSize(storageSize)
                })
              : t('detail.manage.notifications.storageSizeConfirm')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleCalculate}>
            {t('utils:common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

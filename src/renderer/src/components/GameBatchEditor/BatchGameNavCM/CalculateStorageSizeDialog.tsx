import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/ui/alert-dialog'
import { useTranslation } from 'react-i18next'
import { getGameStore } from '~/stores/game/gameStoreFactory'
import { STORAGE_SIZE_NOT_CALCULATED } from '@appTypes/models/game'

interface CalculateStorageSizeDialogProps {
  gameIds: string[]
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  onConfirm: (gameIds: string[]) => void
}

export function CalculateStorageSizeDialog({
  gameIds,
  isOpen,
  setIsOpen,
  onConfirm
}: CalculateStorageSizeDialogProps): React.JSX.Element {
  const { t } = useTranslation('game')

  // Count games that haven't been calculated yet
  const uncachedGameIds = gameIds.filter((id) => {
    const store = getGameStore(id)
    const storageSize = store.getState().getValue('record.storageSize')
    return storageSize === STORAGE_SIZE_NOT_CALCULATED || storageSize === undefined
  })
  const uncachedCount = uncachedGameIds.length

  function handleCalculateAll(): void {
    onConfirm(gameIds)
    setIsOpen(false)
  }

  function handleCalculateUncached(): void {
    onConfirm(uncachedGameIds)
    setIsOpen(false)
  }

  function handleCancel(): void {
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('batchEditor.storageSize.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('batchEditor.storageSize.confirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel onClick={handleCancel}>
            {t('batchEditor.storageSize.cancel')}
          </AlertDialogCancel>
          {uncachedCount > 0 && uncachedCount < gameIds.length && (
            <AlertDialogAction onClick={handleCalculateUncached}>
              <span>{t('batchEditor.storageSize.calculateUncached')}</span>
              <span className="ml-1 text-muted-foreground">
                {t('batchEditor.storageSize.uncachedCount', { count: uncachedCount })}
              </span>
            </AlertDialogAction>
          )}
          <AlertDialogAction onClick={handleCalculateAll} className="ml-0 sm:ml-auto">
            {t('batchEditor.storageSize.calculateAll')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

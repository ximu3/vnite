import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useLibrarybarStore } from '~/components/Librarybar/store'
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

export function RecalculateLastRunDateAlertDialog({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const refreshGameList = useLibrarybarStore((state) => state.refreshGameList)

  const handleRecalculate = (): void => {
    toast.promise(
      ipcManager.invoke('game:recalculate-last-run-date', gameId).then((lastRunDate) => {
        refreshGameList()
        return lastRunDate
      }),
      {
        loading: t('detail.manage.notifications.recalculatingLastRunDate'),
        success: (lastRunDate: string) =>
          lastRunDate
            ? t('detail.manage.notifications.lastRunDateRecalculated', {
                date: lastRunDate
              })
            : t('detail.manage.notifications.lastRunDateCleared'),
        error: () => t('detail.manage.notifications.lastRunDateRecalculateError')
      }
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('detail.manage.recalculateLastRunDate')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('detail.manage.notifications.lastRunDateRecalculateConfirm')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleRecalculate}>
            {t('utils:common.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

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
import { useGameState } from '~/hooks'
import { toast } from 'sonner'
import { useGameCollectionStore } from '~/stores'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

export function DeleteGameAlert({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const [gameName] = useGameState(gameId, 'metadata.name')
  const { removeGameFromAllCollections } = useGameCollectionStore()

  async function deleteGame(): Promise<void> {
    toast.promise(
      async () => {
        removeGameFromAllCollections(gameId)
        await ipcManager.invoke('game:delete', gameId)
        console.log(`Game ${gameId} deleted`)
        navigate({ to: '/library' })
      },
      {
        loading: t('detail.deleteAlert.notifications.deleting', { gameName }),
        success: t('detail.deleteAlert.notifications.deleted', { gameName }),
        error: (err) =>
          t('detail.deleteAlert.notifications.error', { gameName, message: err.message })
      }
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('detail.deleteAlert.title', { gameName })}</AlertDialogTitle>
          <AlertDialogDescription>{t('detail.deleteAlert.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteGame}>{t('utils:common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

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
import { toast } from 'sonner'
import { useGameCollectionStore, useGameRegistry } from '~/stores/game'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useGameBatchEditorStore } from '../store'
import { ipcManager } from '~/app/ipc'

export function DeleteGameAlert({
  gameIds,
  isOpen,
  setIsOpen,
  children
}: {
  gameIds: string[]
  isOpen?: boolean
  setIsOpen?: (value: boolean) => void
  children?: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const { removeGamesFromAllCollections } = useGameCollectionStore()
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const clearSelection = useGameBatchEditorStore((state) => state.clearSelection)

  async function deleteGames(): Promise<void> {
    const gamesCount = gameIds.length
    const gameIdsToDelete = gameIds

    toast.promise(
      async () => {
        // Clear the selection in the batch editor
        clearSelection()

        console.log(`Deleting games: ${gameIdsToDelete.join(', ')}...`)

        // Remove games from favorites
        removeGamesFromAllCollections(gameIdsToDelete)

        // Deleting games from the database
        for (const gameId of gameIdsToDelete) {
          await ipcManager.invoke('game:delete', gameId)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        console.log(`Games deleted: ${gameIdsToDelete.join(', ')}`)
        navigate({ to: '/library' })
      },
      {
        loading: t('batchEditor.delete.notifications.deleting', { count: gamesCount }),
        success: t('batchEditor.delete.notifications.success', { count: gamesCount }),
        error: (err) =>
          t('batchEditor.delete.notifications.error', { count: gamesCount, message: err.message })
      }
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('batchEditor.delete.title', { count: gameIds.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('batchEditor.delete.description')}
            {gameIds.length > 1 && (
              <div className="mt-2">
                <div className="mb-2 font-semibold">{t('batchEditor.delete.gamesList')}</div>
                <div className="overflow-y-auto text-sm max-h-32 scrollbar-base">
                  {gameIds.map((gameId) => (
                    <div key={`batchEditor-delete-${gameId}`} className="mb-1">
                      {gameMetaIndex[gameId]?.name || t('batchEditor.delete.unnamedGame')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteGames}>{t('utils:common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

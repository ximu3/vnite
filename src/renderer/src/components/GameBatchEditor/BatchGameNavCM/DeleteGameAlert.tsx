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
} from '@ui/alert-dialog'
import { toast } from 'sonner'
import { useGameCollectionStore, useGameRegistry } from '~/stores/game'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function DeleteGameAlert({
  gameIds,
  children
}: {
  gameIds: string[]
  children: React.ReactNode
}): JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const { removeGamesFromAllCollections } = useGameCollectionStore()
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)

  async function deleteGames(): Promise<void> {
    const gamesCount = gameIds.length

    toast.promise(
      async () => {
        console.log(`Deleting games: ${gameIds.join(', ')}...`)

        // Remove games from favorites
        removeGamesFromAllCollections(gameIds)

        // Deleting games from the database
        for (const gameId of gameIds) {
          await window.api.game.deleteGame(gameId)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        console.log(`Games deleted: ${gameIds.join(', ')}`)
        navigate('/library')
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
    <AlertDialog>
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

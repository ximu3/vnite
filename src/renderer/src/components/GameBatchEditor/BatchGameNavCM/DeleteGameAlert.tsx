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
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useGameCollectionStore, useGameStore } from '~/stores'
import { useLibrarybarStore } from '~/components/Librarybar'
import { useNavigate } from 'react-router-dom'

export function DeleteGameAlert({
  gameIds,
  children
}: {
  gameIds: string[]
  children: React.ReactNode
}): JSX.Element {
  const navigate = useNavigate()
  const { removeGamesFromAllCollections } = useGameCollectionStore()
  const { refreshGameList } = useLibrarybarStore()
  const { documents } = useGameStore()

  async function deleteGames(): Promise<void> {
    const gamesCount = gameIds.length

    toast.promise(
      async () => {
        console.log(`Deleting games: ${gameIds.join(', ')}...`)

        // Remove games from favorites
        removeGamesFromAllCollections(gameIds)

        // Deleting games from the database
        for (const gameId of gameIds) {
          await ipcInvoke('delete-game-from-db', gameId)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        refreshGameList()
        console.log(`Games deleted: ${gameIds.join(', ')}`)
        navigate('/library')
      },
      {
        loading: `正在删除${gamesCount} 个游戏...`,
        success: `${gamesCount} 个游戏已删除`,
        error: (err) => `删除${gamesCount} 个游戏失败: ${err.message}`
      }
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`确定要删除这 ${gameIds.length} 个游戏吗？`}</AlertDialogTitle>
          <AlertDialogDescription>
            {'删除后，所选游戏的所有数据将被永久删除。此操作不可逆。'}
            {gameIds.length > 1 && (
              <div className="mt-2">
                <div className="mb-2 font-semibold">将要删除的游戏：</div>
                <div className="overflow-y-auto text-sm max-h-32 scrollbar-base">
                  {gameIds.map((gameId, _index) => (
                    <div key={gameId} className="mb-1">
                      {documents.gameId.metadata.name || '未命名游戏'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={deleteGames}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

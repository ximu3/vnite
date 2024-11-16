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
import { useDBSyncedState } from '~/hooks'
import { toast } from 'sonner'
import { useCollections } from '~/hooks'
import { useGameIndexManager } from '~/hooks'
import { useNavigate } from 'react-router-dom'

export function DeleteGameAlert({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): JSX.Element {
  const navigate = useNavigate()
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const { removeGameFromAllCollections } = useCollections()
  const { deleteGame: deleteGameFromIndex } = useGameIndexManager()
  async function deleteGame(): Promise<void> {
    toast.promise(
      async () => {
        await deleteGameFromIndex(gameId)
        await new Promise((resolve) => setTimeout(resolve, 100))
        removeGameFromAllCollections(gameId)
        await new Promise((resolve) => setTimeout(resolve, 100))
        await ipcInvoke('delete-game-from-db', gameId)
        navigate('/library')
      },
      {
        loading: `正在删除游戏 ${gameName}...`,
        success: `游戏 ${gameName} 已删除`,
        error: `删除游戏 ${gameName} 时出错`
      }
    )
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除游戏 {gameName} 吗？</AlertDialogTitle>
          <AlertDialogDescription>
            删除后，游戏的所有数据将被永久删除。此操作不可逆。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={deleteGame}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

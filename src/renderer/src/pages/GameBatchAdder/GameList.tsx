import { useGameBatchAdderStore } from './store'
import { GameListTable } from './GameListTable'
import { useGameAdder } from './hooks/useGameAdder'
import { Button } from '@ui/button'
import { toast } from 'sonner'

export function GameList(): JSX.Element {
  const { isLoading } = useGameBatchAdderStore()
  const { addAllGames } = useGameAdder()

  const handleAddAll = (): void => {
    toast.promise(addAllGames, {
      loading: '正在添加游戏...',
      success: '添加游戏成功',
      error: '添加游戏失败'
    })
  }
  return (
    <div className="w-[870px] h-[75vh]">
      <div className="py-[10px]">
        <GameListTable />
        <div className="flex flex-row-reverse pt-[20px]">
          <Button disabled={isLoading} onClick={handleAddAll}>
            {isLoading ? '添加中...' : '全部添加'}
          </Button>
        </div>
      </div>
    </div>
  )
}

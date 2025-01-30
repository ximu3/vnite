import { cn } from '~/utils'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'

export function StopGame({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  function stopGame(): void {
    toast.promise(
      (async (): Promise<void> => {
        await ipcInvoke('stop-game', gameId)
      })(),
      {
        loading: '正在停止游戏...',
        success: '游戏已停止',
        error: (err) => `停止游戏失败: ${err.message}`
      }
    )
  }
  return (
    <Button className={cn('', className)} variant={'secondary'} onClick={stopGame}>
      <div className={cn('flex flex-row gap-1 justify-center items-center p-3 w-full h-full')}>
        <span className={cn('icon-[mdi--play] w-6 h-6 -ml-1')}></span>
        <div className={cn('')}>停止游戏</div>
      </div>
    </Button>
  )
}

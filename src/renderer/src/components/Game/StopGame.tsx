import { cn } from '~/utils'
import { Button } from '@ui/button'
import { ipcSend } from '~/utils'

export function StopGame({ gameId }: { gameId: string }): JSX.Element {
  return (
    <Button className={cn('')} variant={'secondary'}>
      <div
        className={cn('flex flex-row gap-1 justify-center items-center p-3')}
        onClick={() => ipcSend('stop-game', gameId)}
      >
        <span className={cn('icon-[mdi--play] w-6 h-6 -ml-2')}></span>
        <div className={cn('')}>停止游戏</div>
      </div>
    </Button>
  )
}

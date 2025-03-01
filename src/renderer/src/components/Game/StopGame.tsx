import { cn } from '~/utils'
import { Button } from '@ui/button'
import { stopGame } from '~/utils'

export function StopGame({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  return (
    <Button className={cn('', className)} variant={'secondary'} onClick={() => stopGame(gameId)}>
      <div className={cn('flex flex-row gap-1 justify-center items-center p-3 w-full h-full')}>
        <span className={cn('icon-[mdi--play] w-6 h-6 -ml-1')}></span>
        <div className={cn('')}>停止游戏</div>
      </div>
    </Button>
  )
}

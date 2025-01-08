import { cn, formatTimeToChinese } from '~/utils'
import { GamePoster } from './GamePoster'
import { useGameIndexManager } from '~/hooks'

export function PlayingTimeRank({ className }: { className?: string }): JSX.Element {
  const { sort, gameIndex } = useGameIndexManager()
  const sortedGameIds = sort('playingTime', 'desc')
  const formatTime = (time: number): string => {
    let res: string = formatTimeToChinese(time)
    if (!res.endsWith('秒')) {
      if (res.split(' ')[0].length >= 2) res = res.replace(' ', '\n')
    }
    return res
  }
  return (
    <div className={cn(className)}>
      {sortedGameIds.length === 0 ? (
        <div className={cn('text-center text-2xl')}>暂无游戏</div>
      ) : (
        <div className={cn('flex flex-col gap-2')}>
          {sortedGameIds.map((gameId) => {
            const game = gameIndex[gameId]
            if (!game) return null
            return (
              <GamePoster
                isShowGameName
                infoStyle={cn('flex-row gap-3 justify-between items-center pl-3 pr-3')}
                fontStyles={{
                  name: 'text-lg grow',
                  additionalInfo:
                    'whitespace-pre-wrap text-sm w-[40px] text-end flex-shrink-0 xl:w-auto xl:whitespace-normal'
                }}
                className={cn('w-full h-[50px]')}
                key={gameId}
                gameId={gameId}
                additionalInfo={
                  game.playingTime == 0 ? '从未游玩' : formatTime(game.playingTime as number)
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

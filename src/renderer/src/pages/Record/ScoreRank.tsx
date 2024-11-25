import { cn } from '~/utils'
import { GamePoster } from './GamePoster'
import { useGameIndexManager } from '~/hooks'

export function ScoreRank({ className }: { className?: string }): JSX.Element {
  const { sort, gameIndex } = useGameIndexManager()
  const sortedGameIds = sort('score', 'desc')
  return (
    <div className={cn(className)}>
      {sortedGameIds.length === 0 ? (
        <div className={cn('text-center text-2xl')}>暂无游戏</div>
      ) : (
        <div className={cn('flex flex-col gap-2')}>
          {sortedGameIds.map((gameId) => {
            const game = gameIndex.get(gameId)
            if (!game) return null
            return (
              <GamePoster
                isShowGameName
                infoStyle={cn('flex-row text-sm gap-3 justify-start items-center pl-3')}
                fontStyles={{ name: 'text-lg', additionalInfo: 'text-sm' }}
                className={cn('w-full h-[50px]')}
                key={gameId}
                gameId={gameId}
                additionalInfo={game.score == -1 ? '暂无评分' : `${game.score} 分`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

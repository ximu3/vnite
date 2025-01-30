import { cn } from '~/utils'
import { GamePoster } from './GamePoster'
import { useGameIndexManager } from '~/hooks'
import { FixedSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

export function ScoreRank({ className }: { className?: string }): JSX.Element {
  const { sort, gameIndex } = useGameIndexManager()
  const sortedGameIds = sort('score', 'desc')
  return (
    <div className={cn(className)}>
      {sortedGameIds.length === 0 ? (
        <div className={cn('text-center text-2xl')}>暂无游戏</div>
      ) : (
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemSize={58}
              itemCount={sortedGameIds.length}
              className={cn('overflow-auto scrollbar-base')}
              overscanCount={8}
            >
              {({ index, style }) => {
                const gameId = sortedGameIds[index]
                const game = gameIndex[gameId]
                if (!game) return null
                return (
                  <div style={style} key={gameId} className={cn('pr-1')}>
                    <GamePoster
                      isShowGameName
                      infoStyle={cn('flex-row gap-3 justify-between items-center pl-3 pr-3')}
                      fontStyles={{
                        name: 'text-lg grow',
                        additionalInfo: 'text-sm w-[40px] text-end flex-shrink-0 xl:w-auto'
                      }}
                      className={cn('w-full h-[50px]')}
                      gameId={gameId}
                      additionalInfo={game.score === -1 ? '暂无评分' : `${game.score} 分`}
                    />
                  </div>
                )
              }}
            </FixedSizeList>
          )}
        </AutoSizer>
      )}
    </div>
  )
}

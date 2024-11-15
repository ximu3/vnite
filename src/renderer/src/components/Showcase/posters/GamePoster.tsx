import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { cn } from '~/utils'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { useNavigate } from 'react-router-dom'
import { useGameMedia, useGameIndexManager, useGameTimers } from '~/hooks'
import { formatTimeToChinese, formatDateToChinese } from '~/utils'

export function GamePoster({
  gameId,
  collectionId,
  className
}: {
  gameId: string
  collectionId?: string
  className?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { mediaUrl: cover } = useGameMedia({ gameId, type: 'cover', noToastError: true })
  const { mediaUrl: background } = useGameMedia({ gameId, type: 'background', noToastError: true })
  const { gameIndex } = useGameIndexManager()
  const gameData = gameIndex.get(gameId)
  const { getGamePlayingTime } = useGameTimers()
  const playingTime = getGamePlayingTime(gameId)

  return (
    <HoverCard>
      <HoverCardTrigger>
        <ContextMenu>
          <ContextMenuTrigger>
            <HoverCardAnimation>
              <img
                onClick={() =>
                  navigate(
                    collectionId
                      ? `/library/games/${gameId}/collection:${collectionId}`
                      : `/library/games/${gameId}/0`
                  )
                }
                src={cover}
                alt={gameId}
                className={cn(
                  'w-[148px] h-[222px] cursor-pointer object-cover',
                  '3xl:w-[176px] 3xl:h-[264px]',
                  className
                )}
              />
            </HoverCardAnimation>
          </ContextMenuTrigger>
          <GameNavCM gameId={gameId} />
        </ContextMenu>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        className={cn(
          'p-0 w-[250px] h-[230px] border-0 rounded-none overflow-hidden shadow-xl relative mx-2',
          '3xl:w-[300px] 3xl:h-[272px]'
        )}
      >
        {/* 背景图层 */}
        <div className="absolute inset-0">
          <img src={background} alt={gameId} className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 backdrop-blur-xl" />
        </div>

        {/* 内容区域 */}
        <div className="relative flex flex-col h-full w-full gap-2">
          {/* 游戏标题 */}
          <div className={cn('font-bold text-accent-foreground truncate text-sm px-3 pt-2')}>
            {gameData?.name}
          </div>

          {/* 游戏预览图 */}
          <div className={cn('relative w-full h-[128px]', '3xl:h-[164px]')}>
            <img
              src={background}
              className={cn('object-cover w-full h-full absolute')}
              style={{
                maskImage: 'linear-gradient(to top, transparent 0%, black 30%)'
              }}
              alt={`${gameData?.name} preview`}
            />
          </div>

          {/* 游戏信息 */}

          <div className={cn('flex flex-col gap-2 text-xs justify-center grow px-3 pb-2')}>
            {/* 游玩时间 */}
            <div className="flex flex-row items-center justify-start gap-2">
              <span className={cn('icon-[mdi--access-time] w-4 h-4')}></span>
              <div>
                {playingTime ? `游戏时间 ${formatTimeToChinese(playingTime)}` : '暂无游玩记录'}
              </div>
            </div>

            {/* 最后运行时间 */}
            <div className="flex flex-row items-center justify-start gap-2">
              <span className={cn('icon-[mdi--calendar-blank-outline] w-4 h-4')}></span>
              <div>
                {gameData?.lastRunDate
                  ? `最后运行于 ${formatDateToChinese(gameData.lastRunDate)}`
                  : '从未运行过'}
              </div>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

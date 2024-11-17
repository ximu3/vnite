import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { HoverBigCardAnimation } from '~/components/animations/HoverBigCard'
import { cn } from '~/utils'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { useNavigate } from 'react-router-dom'
import { useGameMedia, useGameIndexManager, useGameTimers, useDBSyncedState } from '~/hooks'
import { formatTimeToChinese, formatDateToChinese } from '~/utils'
import { useState, useEffect } from 'react'

export function BigGamePoster({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { mediaUrl: background } = useGameMedia({ gameId, type: 'background', noToastError: true })
  const { gameIndex } = useGameIndexManager()
  const { getGamePlayingTime } = useGameTimers()
  const [gameData, setGameData] = useState(gameIndex.get(gameId))
  const [playingTime, setPlayingTime] = useState(getGamePlayingTime(gameId))
  const [lastRunDate] = useDBSyncedState('', `games/${gameId}/record.json`, ['lastRunDate'])
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  useEffect(() => {
    setGameData(gameIndex.get(gameId))
    setPlayingTime(getGamePlayingTime(gameId))
  }),
    [gameId, gameIndex, getGamePlayingTime]

  return (
    <HoverCard>
      <HoverCardTrigger className={cn('rounded-none')}>
        <ContextMenu>
          <ContextMenuTrigger className={cn('rounded-none')}>
            <div
              className={cn(
                'relative overflow-hidden shadow-custom-initial cursor-pointer w-[333px] h-[222px] rounded-none',
                '3xl:w-[396px] 3xl:h-[264px]'
              )}
            >
              <HoverBigCardAnimation className={cn('rounded-none')}>
                {background ? (
                  <img
                    onClick={() => navigate(`/library/games/${gameId}/all`)}
                    src={background}
                    alt={gameId}
                    className={cn(
                      'w-full h-full cursor-pointer object-cover',
                      '3xl:w-full 3xl:h-full',
                      className
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'w-full h-full cursor-pointer object-cover flex items-center justify-center',
                      '3xl:w-full 3xl:h-full',
                      className
                    )}
                    onClick={() => navigate(`/library/games/${gameId}/all`)}
                  >
                    {gameName}
                  </div>
                )}
              </HoverBigCardAnimation>

              <div className="rounded-none absolute bg-muted/60 flex items-center pl-5 flex-row justify-start bottom-0 w-full transform-gpu will-change-opacity h-1/3 backdrop-blur-2xl border-t-0.5 border-white/30">
                <div className="flex items-center justify-center shadow-sm shadow-black/50 w-14 h-14 bg-gradient-to-tl from-primary to-accent">
                  <span className="icon-[mdi--clock-star-four-points] w-8 h-8"></span>
                </div>
                <div className="flex flex-col gap-1 p-4">
                  <div className="text-xs font-semibold text-accent-foreground/80">游玩记录</div>
                  <div className="flex flex-row text-xs">
                    <div className="font-semibold">总游戏时长：</div>
                    <div className="font-semibold">
                      {playingTime ? formatTimeToChinese(playingTime) : '暂无游玩记录'}
                    </div>
                  </div>
                  <div className="flex flex-row text-xs">
                    <div className="font-semibold">最后运行日期：</div>
                    <div className="font-semibold">
                      {lastRunDate !== '' ? formatDateToChinese(lastRunDate) : '从未运行'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
            {background ? (
              <img
                src={background}
                className={cn('object-cover w-full h-full absolute')}
                style={{
                  maskImage: 'linear-gradient(to top, transparent 0%, black 30%)'
                }}
                alt={`${gameData?.name} preview`}
              />
            ) : (
              <div className={cn('w-full h-full absolute')}>
                <div className={cn('flex items-center justify-center w-full h-full font-bold')}>
                  {gameData?.name}
                </div>
              </div>
            )}
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

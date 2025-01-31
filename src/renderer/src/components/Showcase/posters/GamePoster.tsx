import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { cn } from '~/utils'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { useNavigate } from 'react-router-dom'
import { useGameIndexManager, useDBSyncedState } from '~/hooks'
import { formatTimeToChinese, formatDateToChinese } from '~/utils'
import React, { useRef, MutableRefObject } from 'react'
import { AttributesDialog } from '~/components/Game/Config/AttributesDialog'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'

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
  const { gameIndex } = useGameIndexManager()
  const gameData = gameIndex[gameId]
  const [playingTime] = useDBSyncedState(0, `games/${gameId}/record.json`, ['playingTime'])
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const openTimeoutRef: MutableRefObject<NodeJS.Timeout | undefined> = useRef(undefined)
  const closeTimeoutRef: MutableRefObject<NodeJS.Timeout | undefined> = useRef(undefined)
  const openDelay = 200
  const closeDelay = 0

  const handleMouseEnter = (): void => {
    clearTimeout(closeTimeoutRef.current ?? undefined)
    openTimeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, openDelay)
  }

  const handleMouseLeave = (): void => {
    clearTimeout(openTimeoutRef.current ?? undefined)
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, closeDelay)
  }
  return (
    <HoverCard open={isOpen}>
      <ContextMenu>
        <HoverCardTrigger
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn('rounded-none')}
        >
          <ContextMenuTrigger>
            <HoverCardAnimation>
              <GameImage
                onClick={() =>
                  navigate(
                    collectionId
                      ? `/library/games/${gameId}/collection:${collectionId}`
                      : `/library/games/${gameId}/all`
                  )
                }
                gameId={gameId}
                type="cover"
                alt={gameId}
                className={cn(
                  'w-[148px] h-[222px] cursor-pointer object-cover',
                  '3xl:w-[176px] 3xl:h-[264px]',
                  className
                )}
                fallback={
                  <div
                    className={cn(
                      'w-[148px] h-[222px] cursor-pointer object-cover flex items-center justify-center',
                      '3xl:w-[176px] 3xl:h-[264px]',
                      className
                    )}
                    onClick={() =>
                      navigate(
                        collectionId
                          ? `/library/games/${gameId}/collection:${collectionId}`
                          : `/library/games/${gameId}/all`
                      )
                    }
                  >
                    <div className={cn('font-bold truncate p-1')}>{gameName}</div>
                  </div>
                }
              />
            </HoverCardAnimation>
          </ContextMenuTrigger>
        </HoverCardTrigger>
        <GameNavCM
          gameId={gameId}
          openAttributesDialog={() => setIsAttributesDialogOpen(true)}
          openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
        />
      </ContextMenu>

      {isAttributesDialogOpen && (
        <AttributesDialog gameId={gameId} setIsOpen={setIsAttributesDialogOpen} />
      )}
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}

      <HoverCardContent
        side="right"
        className={cn(
          'p-0 w-[250px] h-[230px] border-0 rounded-none overflow-hidden shadow-xl relative mx-2',
          '3xl:w-[300px] 3xl:h-[272px]'
        )}
      >
        {/* background layer */}
        <div className="absolute inset-0">
          <GameImage
            gameId={gameId}
            type="background"
            alt={gameId}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-accent/40 to-accent/80 backdrop-blur-xl" />
        </div>

        {/* content area */}
        <div className="relative flex flex-col h-full w-full gap-2">
          {/* Game Title */}
          <div className={cn('font-bold text-accent-foreground truncate text-sm px-3 pt-2')}>
            {gameData?.name}
          </div>

          {/* Game Preview Image */}
          <div className={cn('relative w-full h-[128px]', '3xl:h-[164px]')}>
            <GameImage
              gameId={gameId}
              type="background"
              className={cn('object-cover w-full h-full')}
              style={{
                maskImage: 'linear-gradient(to top, transparent 0%, black 30%)'
              }}
              alt={`${gameData?.name} preview`}
              fallback={
                <div className={cn('w-full h-full absolute')}>
                  <div className={cn('flex items-center justify-center w-full h-full font-bold')}>
                    {gameData?.name}
                  </div>
                </div>
              }
            />
          </div>

          {/* Game Information */}

          <div className={cn('flex flex-col gap-2 text-xs justify-center grow px-3 pb-2')}>
            {/* Playing time */}
            <div className="flex flex-row items-center justify-start gap-2">
              <span className={cn('icon-[mdi--access-time] w-4 h-4')}></span>
              <div>
                {playingTime ? `游戏时间 ${formatTimeToChinese(playingTime)}` : '暂无游玩记录'}
              </div>
            </div>

            {/* Last running time */}
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

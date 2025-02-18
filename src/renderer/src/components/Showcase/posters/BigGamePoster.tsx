import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@ui/hover-card'
import React, { MutableRefObject, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HoverBigCardAnimation } from '~/components/animations/HoverBigCard'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { AttributesDialog } from '~/components/Game/Config/AttributesDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayingTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayingTimeEditorDialog'
import { GameImage } from '~/components/ui/game-image'
import { useDBSyncedState, useGameIndexManager } from '~/hooks'
import { cn, formatDateToChinese, formatTimeToChinese } from '~/utils'

export function BigGamePoster({
  gameId,
  groupId,
  className
}: {
  gameId: string
  groupId?: string
  className?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { gameIndex } = useGameIndexManager()
  const [playingTime] = useDBSyncedState(0, `games/${gameId}/record.json`, ['playingTime'])
  const gameData = gameIndex[gameId]
  const [lastRunDate] = useDBSyncedState('', `games/${gameId}/record.json`, ['lastRunDate'])
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayingTimeEditorDialogOpen, setIsPlayingTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)
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
          <ContextMenuTrigger className={cn('rounded-none')}>
            <div
              className={cn(
                'relative overflow-hidden shadow-custom-initial cursor-pointer w-[333px] h-[222px] rounded-none',
                '3xl:w-[396px] 3xl:h-[264px]'
              )}
            >
              <HoverBigCardAnimation className={cn('rounded-none w-full h-full')}>
                <GameImage
                  onClick={() =>
                    groupId
                      ? navigate(`/library/games/${gameId}/${groupId}`)
                      : navigate(`/library/games/${gameId}/all`)
                  }
                  gameId={gameId}
                  type="background"
                  className={cn(
                    'w-full h-full cursor-pointer object-cover',
                    '3xl:w-full 3xl:h-full',
                    className
                  )}
                  fallback={
                    <div
                      className={cn(
                        'w-[333px] h-[222px] cursor-pointer object-cover flex items-center justify-center pb-10 font-bold',
                        '3xl:w-[396px] 3xl:h-[264px]',
                        className
                      )}
                      onClick={() =>
                        groupId
                          ? navigate(`/library/games/${gameId}/${groupId}`)
                          : navigate(`/library/games/${gameId}/all`)
                      }
                    >
                      {gameName}
                    </div>
                  }
                />
              </HoverBigCardAnimation>
              <div className="rounded-none absolute bg-muted/60 flex items-center pl-5 flex-row justify-start bottom-0 w-full transform-gpu will-change-opacity h-1/3 backdrop-blur-2xl border-t-0.5 border-white/30">
                <div className="flex items-center justify-center shadow-sm shadow-black/50 w-14 h-14 bg-primary">
                  <span className="icon-[mdi--clock-star-four-points] w-8 h-8 text-primary-foreground/70"></span>
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
        </HoverCardTrigger>
        <GameNavCM
          gameId={gameId}
          openAttributesDialog={() => setIsAttributesDialogOpen(true)}
          openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
          openPlayingTimeEditorDialog={() => setIsPlayingTimeEditorDialogOpen(true)}
        />
      </ContextMenu>

      {isAttributesDialogOpen && (
        <AttributesDialog gameId={gameId} setIsOpen={setIsAttributesDialogOpen} />
      )}
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
      {isNameEditorDialogOpen && (
        <NameEditorDialog gameId={gameId} setIsOpen={setIsNameEditorDialogOpen} />
      )}
      {isPlayingTimeEditorDialogOpen && (
        <PlayingTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayingTimeEditorDialogOpen} />
      )}

      <HoverCardContent
        side="right"
        className={cn(
          'p-0 w-[250px] h-[230px] border-0 rounded-none overflow-hidden shadow-xl relative mx-2',
          '3xl:w-[300px] 3xl:h-[272px] cursor-pointer'
        )}
      >
        {/* background layer */}
        <div className="absolute inset-0">
          <GameImage gameId={gameId} type="background" className="object-cover w-full h-full" />
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
              className={cn('object-cover w-full h-full absolute')}
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

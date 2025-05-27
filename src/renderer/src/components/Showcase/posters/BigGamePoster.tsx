import { Button } from '@ui/button'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { GameImage } from '~/components/ui/game-image'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { useGameRegistry } from '~/stores/game'
import { cn, navigateToGame, startGame, stopGame } from '~/utils'

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
  const gameData = useGameRegistry((state) => state.gameMetaIndex[gameId])
  const runningGames = useRunningGames((state) => state.runningGames)
  const [playTime] = useGameState(gameId, 'record.playTime')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = useState(false)
  const [showPlayButtonOnPoster] = useConfigState('appearances.showcase.showPlayButtonOnPoster')
  const { t } = useTranslation('game')

  return (
    <ContextMenu>
      <div className="relative">
        <ContextMenuTrigger className={cn('')}>
          <div
            className="flex flex-col items-center justify-center gap-[8px] cursor-pointer group"
            onClick={() => navigateToGame(navigate, gameId, groupId)}
          >
            <div
              className={cn(
                'rounded-lg shadow-md',
                'transition-all duration-300 ease-in-out',
                'ring-0 ring-border',
                'group-hover:ring-2 group-hover:ring-primary',
                'relative overflow-hidden group'
              )}
            >
              <div className="absolute inset-0 z-10 transition-all duration-300 rounded-lg pointer-events-none bg-background/15 group-hover:bg-transparent" />
              <HoverCardAnimation>
                <GameImage
                  onClick={() => navigateToGame(navigate, gameId, groupId)}
                  gameId={gameId}
                  type="background"
                  blur={nsfw && enableNSFWBlur}
                  className={cn(
                    'h-[222px] aspect-[3/2] cursor-pointer select-none object-cover rounded-lg bg-accent/30',
                    className
                  )}
                  fallback={
                    <div
                      className={cn(
                        'w-[333px] aspect-[3/2] cursor-pointer object-cover flex items-center justify-center font-bold bg-muted/50',
                        className
                      )}
                    >
                      {gameName}
                    </div>
                  }
                />
              </HoverCardAnimation>
              {/* Hover overlay */}
              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 h-full bg-accent/50',
                  'transition-opacity duration-300 ease-in-out',
                  'flex flex-col p-[10px] text-accent-foreground',
                  'opacity-0 group-hover:opacity-100',
                  'overflow-hidden'
                )}
              >
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center flex-grow">
                  {showPlayButtonOnPoster &&
                    (runningGames.includes(gameId) ? (
                      <Button
                        variant="secondary"
                        className="rounded-full w-[46px] h-[46px] p-0 bg-secondary hover:bg-secondary/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          stopGame(gameId)
                        }}
                      >
                        <span className="icon-[mdi--stop] text-secondary-foreground w-7 h-7"></span>
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="rounded-full w-[46px] h-[46px] p-0 bg-primary hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigateToGame(navigate, gameId, groupId || 'all')
                          startGame(gameId)
                        }}
                      >
                        <span className="icon-[mdi--play] text-primary-foreground w-7 h-7"></span>
                      </Button>
                    ))}
                </div>

                {/* Game info */}
                <div className="flex flex-col gap-2 mt-auto text-xs font-semibold select-none">
                  {/* Play time */}
                  <div className="flex flex-row items-center justify-start gap-2">
                    <span className="icon-[mdi--access-time] w-4 h-4"></span>
                    <div>
                      {playTime
                        ? t('utils:format.gameTime', { time: playTime })
                        : t('showcase.gameCard.noPlayRecord')}
                    </div>
                  </div>

                  {/* Last run time */}
                  <div className="flex flex-row items-center justify-start gap-2">
                    <span className="icon-[mdi--calendar-blank-outline] w-4 h-4"></span>
                    <div>
                      {gameData?.lastRunDate
                        ? t('utils:format.niceDate', {
                            date: new Date(gameData.lastRunDate)
                          })
                        : t('showcase.gameCard.neverRun')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[13px] cursor-pointer select-none text-foreground hover:underline decoration-foreground truncate w-[333px] text-center">
              {gameData?.name}
            </div>
          </div>
        </ContextMenuTrigger>
      </div>
      <GameNavCM
        gameId={gameId}
        groupId={groupId || 'all'}
        openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
        openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
        openPlayTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
      />

      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
      {isNameEditorDialogOpen && (
        <NameEditorDialog gameId={gameId} setIsOpen={setIsNameEditorDialogOpen} />
      )}
      {isPlayTimeEditorDialogOpen && (
        <PlayTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayTimeEditorDialogOpen} />
      )}
    </ContextMenu>
  )
}

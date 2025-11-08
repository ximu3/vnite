import { NSFWBlurLevel } from '@appTypes/models'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { GamePropertiesDialog } from '~/components/Game/Config/Properties'
import { BatchGameNavCM } from '~/components/GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { ContextMenu, ContextMenuTrigger } from '~/components/ui/context-menu'
import { GameImage } from '~/components/ui/game-image'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { useGameRegistry } from '~/stores/game'
import { cn, navigateToGame } from '~/utils'
import { PlayButton } from './PlayButton'

export function BigGamePoster({
  gameId,
  groupId,
  className,
  inViewGames = [] // TODO: Support shift selection in BigGamePoster
}: {
  gameId: string
  groupId?: string
  className?: string
  inViewGames?: string[]
}): React.JSX.Element {
  const navigate = useNavigate()
  const gameData = useGameRegistry((state) => state.gameMetaIndex[gameId])
  const runningGames = useRunningGames((state) => state.runningGames)
  const [playTime] = useGameState(gameId, 'record.playTime')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false)
  const [showPlayButtonOnPoster] = useConfigState('appearances.showcase.showPlayButtonOnPoster')
  const { t } = useTranslation('game')

  const name = gameData?.name ?? ''
  const stringToBase64 = (str: string): string =>
    btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  const obfuscatedName = stringToBase64(name).slice(0, name.length)

  // Batch selection state
  const {
    selectedGamesMap,
    selectGame,
    unselectGame,
    lastSelectedId,
    setLastSelectedId,
    isBatchMode
  } = useGameBatchEditorStore()

  const isSelected = !!selectedGamesMap[gameId]

  const handleSelect = (e: React.MouseEvent): void => {
    e.stopPropagation()

    if (e.shiftKey && lastSelectedId && inViewGames.length > 0) {
      // Shift+click to select a range of games
      const lastIndex = inViewGames.indexOf(lastSelectedId)
      const currentIndex = inViewGames.indexOf(gameId)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const startIndex = Math.min(lastIndex, currentIndex)
        const endIndex = Math.max(lastIndex, currentIndex)

        for (let i = startIndex; i <= endIndex; i++) {
          selectGame(inViewGames[i])
        }
      } else {
        // If the index is not found, just select the current game
        selectGame(gameId)
      }
    } else {
      // Normal click selection
      if (isSelected) {
        unselectGame(gameId)
      } else {
        selectGame(gameId)
        setLastSelectedId(gameId)
      }
    }
  }

  // Ctrl+click to select multiple games, instead of navigating to the game detail page
  const handleGameClick = (e: React.MouseEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      handleSelect(e)
    } else {
      navigateToGame(navigate, gameId, groupId)
    }
  }

  return (
    <ContextMenu>
      <div className="relative">
        <ContextMenuTrigger className={cn('')}>
          <div
            className="flex flex-col items-center justify-center gap-[8px] cursor-pointer group"
            onClick={handleGameClick}
          >
            <div
              className={cn(
                'rounded-lg shadow-md',
                'transition-all duration-300 ease-in-out',
                isSelected
                  ? 'ring-2 ring-primary'
                  : 'ring-0 ring-border group-hover:ring-2 group-hover:ring-primary',
                'relative overflow-hidden group'
              )}
            >
              <HoverCardAnimation>
                <GameImage
                  onClick={handleGameClick}
                  gameId={gameId}
                  type="background"
                  blur={nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImage}
                  initialMask={true}
                  blurType="bigposter"
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
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  'overflow-hidden'
                )}
              >
                {/* Multi-select dot */}
                <div
                  className={cn(
                    'absolute left-2 top-2 shadow-md z-20 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer',
                    'transition-colors duration-200',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/70 hover:bg-muted/90'
                  )}
                  onClick={handleSelect}
                >
                  {isSelected && <span className="icon-[mdi--check] w-3 h-3" />}
                </div>

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center flex-grow">
                  {showPlayButtonOnPoster && (
                    <PlayButton
                      type={runningGames.includes(gameId) ? 'stop' : 'play'}
                      gameId={gameId}
                      groupId={groupId}
                    />
                  )}
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

            <div className="text-xs cursor-pointer select-none text-foreground hover:underline decoration-foreground truncate w-[333px] text-center">
              {nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImageAndTitle ? (
                <>
                  <span className="block group-hover:hidden truncate">{obfuscatedName}</span>
                  <span className="hidden group-hover:block truncate">{name}</span>
                </>
              ) : (
                name
              )}
            </div>
          </div>
        </ContextMenuTrigger>
      </div>

      {/* Switch context menu based on batch mode */}
      {isBatchMode ? (
        <BatchGameNavCM openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)} />
      ) : (
        <GameNavCM
          gameId={gameId}
          openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
          openPlayTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
          openPropertiesDialog={() => setIsPropertiesDialogOpen(true)}
        />
      )}

      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
      {isNameEditorDialogOpen && (
        <NameEditorDialog gameId={gameId} setIsOpen={setIsNameEditorDialogOpen} />
      )}
      {isPlayTimeEditorDialogOpen && (
        <PlayTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayTimeEditorDialogOpen} />
      )}
      {isPropertiesDialogOpen && (
        <GamePropertiesDialog
          gameId={gameId}
          isOpen={isPropertiesDialogOpen}
          setIsOpen={setIsPropertiesDialogOpen}
        />
      )}
    </ContextMenu>
  )
}

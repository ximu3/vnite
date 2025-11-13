import { NSFWBlurLevel } from '@appTypes/models'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Nav } from '@ui/nav'
import React, { useEffect } from 'react'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { GamePropertiesDialog } from '~/components/Game/Config/Properties'
import { ContextMenu, ContextMenuTrigger } from '~/components/ui/context-menu'
import { GameImage } from '~/components/ui/game-image'
import { useConfigState, useGameLocalState, useGameState } from '~/hooks'
import { useLibraryStore } from '~/pages/Library/store'
import { useGamePathStore } from '~/stores/game/gamePathStore'
import { cn, startGame } from '~/utils'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { InformationDialog } from '../Game/Overview/Information/InformationDialog'
import { BatchGameNavCM } from '../GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '../GameBatchEditor/store'
import { useTheme } from '../ThemeProvider'

export function GameNav({
  gameId,
  groupId
}: {
  gameId: string
  groupId: string
}): React.JSX.Element {
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const isPathValid = useGamePathStore((s) => s.paths[gamePath]?.valid)

  useEffect(() => {
    if (gamePath) {
      useGamePathStore.getState().requestValidity(gamePath)
    }
  }, [gamePath])

  const [highlightLocalGames] = useConfigState('game.gameList.highlightLocalGames')
  const [markLocalGames] = useConfigState('game.gameList.markLocalGames')
  const [warnInvalidGamePaths] = useConfigState('game.gameList.warnInvalidGamePaths')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')
  const isDarkMode = useTheme().isDark
  const location = useLocation()
  const navigate = useNavigate()

  const libraryBarWidth = useLibraryStore((state) => state.libraryBarWidth)

  // dialog box state
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = React.useState(false)
  const [isInformationDialogOpen, setIsInformationDialogOpen] = React.useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = React.useState(false)

  const isSelected = useGameBatchEditorStore((state) => state.selectedGamesMap[gameId])
  const isBatchMode = useGameBatchEditorStore((state) => state.isBatchMode)

  console.warn('[DEBUG] GameNav')

  const stringToBase64 = (str: string): string =>
    btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  const obfuscatedGameName = stringToBase64(gameName).slice(0, gameName.length)

  const handleDoubleClick = (event: React.MouseEvent): void => {
    event.preventDefault()
    event.stopPropagation()
    startGame(gameId, navigate, groupId)
  }

  const handleGameClick = (event: React.MouseEvent): void => {
    const store = useGameBatchEditorStore.getState()
    const { addGameId, removeGameId, clearGameIds, lastSelectedId, setLastSelectedId, gameIds } =
      store

    if (location.pathname.includes(`/library/games/`)) {
      // If the current route is already a game detail page, add the gameId to the batch editor store
      const routerGameId = location.pathname.split('/')[3]
      addGameId(routerGameId)
    }

    // If special operations are performed in batch selection mode, prevent default navigation
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      event.preventDefault()

      if (event.shiftKey && lastSelectedId) {
        // Get all games in the currently visible AccordionContent
        const accordionContent = (event.currentTarget as HTMLElement).closest('.accordion-content')

        if (accordionContent) {
          const visibleGameElements = Array.from(
            accordionContent.querySelectorAll('[data-game-id]')
          ) as HTMLElement[]

          const currentGameIds = visibleGameElements
            .map((el) => el.dataset.gameId)
            .filter(Boolean) as string[]

          const currentIndex = currentGameIds.indexOf(gameId)
          const lastSelectedIndex = currentGameIds.indexOf(lastSelectedId)

          if (currentIndex !== -1 && lastSelectedIndex !== -1) {
            const start = Math.min(currentIndex, lastSelectedIndex)
            const end = Math.max(currentIndex, lastSelectedIndex)

            const selectedRange = currentGameIds.slice(start, end + 1)

            if (event.ctrlKey || event.metaKey) {
              // Shift + Ctrl/Cmd: Add to existing selection
              selectedRange.forEach((id) => {
                if (!gameIds.includes(id)) {
                  addGameId(id)
                }
              })
            } else {
              // Shift: Replacement of existing options
              clearGameIds()
              selectedRange.forEach((id) => addGameId(id))
            }
          }
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd Click
        if (isSelected) {
          removeGameId(gameId)
        } else {
          addGameId(gameId)
        }
      }

      setLastSelectedId(gameId)
    } else {
      // Normal click - allow navigation to occur
      // If not in batch mode, clear the selected games
      clearGameIds()
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onClick={handleGameClick}
            onDoubleClick={handleDoubleClick}
            data-game-id={gameId}
            data-group-id={encodeURIComponent(groupId)}
          >
            <Nav
              variant="gameList"
              className={cn(
                'text-xs p-3 h-5 rounded-none transition-none w-full group/gamenav',
                highlightLocalGames && 'text-foreground',
                highlightLocalGames && gamePath && isPathValid && 'text-accent-foreground',
                highlightLocalGames && !gamePath && !isDarkMode && 'text-foreground',
                isSelected && 'bg-accent/[calc(var(--glass-opacity)*2)]'
              )}
              to="/library/games/$gameId/$groupId"
              params={{ gameId, groupId: encodeURIComponent(groupId) }}
              resetScroll={false}
            >
              <div className={cn('flex flex-row gap-2 items-center w-full')}>
                <div className={cn('flex items-center')}>
                  <GameImage
                    gameId={gameId}
                    type="icon"
                    alt="icon"
                    className={cn('w-[18px] h-[18px] rounded-md object-cover bg-accent shadow-sm')}
                    fallback={
                      <span className={cn('icon-[mdi--gamepad-variant] w-[18px] h-[18px]')}></span>
                    }
                  />
                </div>
                {nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImageAndTitle ? (
                  <div
                    className="relative truncate"
                    style={{ width: `${libraryBarWidth - (markLocalGames ? 70 : 60)}px` }}
                  >
                    <span className="group-hover/gamenav:opacity-0">{obfuscatedGameName}</span>
                    <span className="absolute top-0 left-0 w-full truncate opacity-0 group-hover/gamenav:opacity-100">
                      {gameName}
                    </span>
                  </div>
                ) : (
                  <div
                    className={cn('truncate')}
                    style={{ width: `${libraryBarWidth - (markLocalGames ? 70 : 60)}px` }}
                  >
                    {gameName}
                  </div>
                )}

                {markLocalGames && gamePath && isPathValid && (
                  <span className="icon-[mdi--check-outline] w-[10px] h-[10px] flex-shrink-0" />
                )}
                {markLocalGames && gamePath && !isPathValid && warnInvalidGamePaths && (
                  <span className="icon-[mdi--alert-circle-outline] w-[12px] h-[12px] text-destructive flex-shrink-0" />
                )}
              </div>
            </Nav>
          </div>
        </ContextMenuTrigger>
        {isBatchMode ? (
          <BatchGameNavCM openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)} />
        ) : (
          <GameNavCM
            gameId={gameId}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
            openNameEditorDialog={() => setIsInformationDialogOpen(true)}
            openPlayTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
            openPropertiesDialog={() => setIsPropertiesDialogOpen(true)}
          />
        )}
      </ContextMenu>

      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
      {isInformationDialogOpen && (
        <InformationDialog
          gameId={gameId}
          isOpen={isInformationDialogOpen}
          setIsOpen={setIsInformationDialogOpen}
        />
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
    </>
  )
}

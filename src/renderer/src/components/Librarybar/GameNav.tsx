import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { Nav } from '@ui/nav'
import React from 'react'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { AttributesDialog } from '~/components/Game/Config/AttributesDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { useGameState, useGameLocalState, useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { BatchGameNavCM } from '../GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '../GameBatchEditor/store'

export function GameNav({
  gameId,
  groupId,
  scrollPosition
}: {
  gameId: string
  groupId: string
  scrollPosition?: { x: number; y: number }
}): JSX.Element {
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [highlightLocalGames] = useConfigState('game.gameList.highlightLocalGames')
  const [markLocalGames] = useConfigState('game.gameList.markLocalGames')

  // dialog box state
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)

  const isSelected = useGameBatchEditorStore((state) => state.selectedGamesMap[gameId])
  const isBatchMode = useGameBatchEditorStore((state) => state.isBatchMode)

  console.warn('[DEBUG] GameNav')

  const handleGameClick = (event: React.MouseEvent): void => {
    event.preventDefault()

    const store = useGameBatchEditorStore.getState()
    const { addGameId, removeGameId, clearGameIds, lastSelectedId, setLastSelectedId, gameIds } =
      store

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
    } else {
      // normal click
      clearGameIds()
      addGameId(gameId)
    }

    setLastSelectedId(gameId)
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div onClick={handleGameClick} data-game-id={gameId} data-group-id={groupId}>
            <Nav
              variant="gameList"
              className={cn(
                'text-xs p-3 h-5 rounded-none',
                highlightLocalGames && gamePath && 'text-accent-foreground',
                isSelected && isBatchMode && 'bg-accent'
              )}
              to={`./games/${gameId}/${groupId}`}
            >
              <div className={cn('flex flex-row gap-2 items-center w-full')}>
                <div className={cn('flex items-center')}>
                  <GameImage
                    gameId={gameId}
                    type="icon"
                    alt="icon"
                    scrollPosition={scrollPosition}
                    className={cn('w-[18px] h-[18px] rounded-md object-cover bg-accent shadow-sm')}
                    fallback={
                      <span className={cn('icon-[mdi--gamepad-variant] w-[18px] h-[18px]')}></span>
                    }
                  />
                </div>
                <div className={cn('truncate flex-grow')}>{gameName}</div>
                {markLocalGames && gamePath && (
                  <span
                    className={cn(
                      'icon-[mdi--check-outline] w-[10px] h-[10px] mr-[-6px] flex-shrink-0'
                    )}
                  ></span>
                )}
              </div>
            </Nav>
          </div>
        </ContextMenuTrigger>
        {isBatchMode ? (
          <BatchGameNavCM
            openAttributesDialog={() => setIsAttributesDialogOpen(true)}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          />
        ) : (
          <GameNavCM
            gameId={gameId}
            openAttributesDialog={() => setIsAttributesDialogOpen(true)}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
            openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
            openPlayTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
          />
        )}
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
      {isPlayTimeEditorDialogOpen && (
        <PlayTimeEditorDialog gameId={gameId} setIsOpen={setIsPlayTimeEditorDialogOpen} />
      )}
    </>
  )
}

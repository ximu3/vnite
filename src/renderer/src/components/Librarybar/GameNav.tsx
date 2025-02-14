import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { Nav } from '@ui/nav'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { useDBSyncedState } from '~/hooks'
import { cn } from '~/utils'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { AddCollectionDialog } from '../dialog/AddCollectionDialog'
import { AttributesDialog } from '../Game/Config/AttributesDialog'
import { BatchGameNavCM } from '../GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '../GameBatchEditor/store'

export function GameNav({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  const location = useLocation()
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [gamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [highlightLocalGames] = useDBSyncedState(true, 'config.json', [
    'others',
    'gameList',
    'highlightLocalGames'
  ])
  const [markLocalGames] = useDBSyncedState(true, 'config.json', [
    'others',
    'gameList',
    'markLocalGames'
  ])
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const { addGameId, removeGameId, clearGameIds, gameIds, lastSelectedId, setLastSelectedId } =
    useGameBatchEditorStore()

  const isLocated = location.pathname.includes(`/games/${gameId}`)

  // Check if the current game is selected
  const isSelected = gameIds.includes(gameId)

  // Check if the batch mode is enabled
  const isBatchMode = gameIds.length > 1

  const handleGameClick = (event: React.MouseEvent): void => {
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
        if (!location.pathname.includes(`/games/${gameId}/${groupId}`)) {
          removeGameId(gameId)
        }
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
          <div onClick={handleGameClick} data-game-id={gameId}>
            <Nav
              variant="gameList"
              className={cn('text-xs p-3 h-5 rounded-none', {
                'text-accent-foreground':
                  (highlightLocalGames && gamePath) ||
                  (!highlightLocalGames && isSelected && isBatchMode) ||
                  (!highlightLocalGames && isLocated),
                'hover:text-accent-foreground': !highlightLocalGames,
                'bg-accent': (isSelected && isBatchMode) || isLocated
              })}
              to={`./games/${gameId}/${groupId}`}
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
                <div className={cn('truncate flex-grow')}>{gameName}</div>
                {markLocalGames && gamePath && (
                  <span
                    className={cn(
                      'icon-[mdi--check-outline] w-[10px] h-[10px] mr-[-10px] flex-shrink-0'
                    )}
                  ></span>
                )}
              </div>
            </Nav>
          </div>
        </ContextMenuTrigger>
        {isBatchMode ? (
          <BatchGameNavCM
            gameIds={gameIds}
            openAttributesDialog={() => setIsAttributesDialogOpen(true)}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          />
        ) : (
          <GameNavCM
            gameId={gameId}
            openAttributesDialog={() => setIsAttributesDialogOpen(true)}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          />
        )}
      </ContextMenu>
      {isAttributesDialogOpen && (
        <AttributesDialog gameId={gameId} setIsOpen={setIsAttributesDialogOpen} />
      )}
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={[gameId]} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
    </>
  )
}

import { ContextMenu, ContextMenuTrigger } from '~/components/ui/context-menu'
import { GameImage } from '~/components/ui/game-image'
import { Nav } from '@ui/nav'
import React from 'react'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { GamePropertiesDialog } from '~/components/Game/Config/Properties'
import { useGameState, useGameLocalState, useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { BatchGameNavCM } from '../GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '../GameBatchEditor/store'
import { useTheme } from '../ThemeProvider'
import { useLocation } from '@tanstack/react-router'

export function GameNav({
  gameId,
  groupId
}: {
  gameId: string
  groupId: string
}): React.JSX.Element {
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [highlightLocalGames] = useConfigState('game.gameList.highlightLocalGames')
  const [markLocalGames] = useConfigState('game.gameList.markLocalGames')
  const isDarkMode = useTheme().isDark
  const location = useLocation()

  // dialog box state
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = React.useState(false)

  const isSelected = useGameBatchEditorStore((state) => state.selectedGamesMap[gameId])
  const isBatchMode = useGameBatchEditorStore((state) => state.isBatchMode)

  console.warn('[DEBUG] GameNav')

  const handleGameClick = (event: React.MouseEvent): void => {
    const store = useGameBatchEditorStore.getState()
    const { addGameId, removeGameId, clearGameIds, lastSelectedId, setLastSelectedId, gameIds } =
      store

    if (location.pathname.includes(`/library/games/`)) {
      // 如果在游戏详情页面，把当前游戏ID添加到选择列表
      const routerGameId = location.pathname.split('/')[3]
      addGameId(routerGameId)
    }

    // 如果是批量选择模式下的特殊操作，阻止默认导航
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
      // 正常点击 - 允许导航发生
      clearGameIds()
      // 不调用 preventDefault()，让 Link 组件处理导航
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div onClick={handleGameClick} data-game-id={gameId} data-group-id={groupId}>
            <Nav
              variant="gameList"
              className={cn(
                'text-xs p-3 h-5 rounded-none transition-none w-full',
                highlightLocalGames && 'text-foreground',
                highlightLocalGames && gamePath && 'text-accent-foreground',
                highlightLocalGames && !gamePath && !isDarkMode && 'text-foreground/90',
                isSelected && 'bg-accent/60'
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
                <div className={cn('truncate w-[188px]')}>{gameName}</div>
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
          <BatchGameNavCM openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)} />
        ) : (
          <GameNavCM
            gameId={gameId}
            groupId={groupId}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
            openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
            openPlayTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
            openPropertiesDialog={() => setIsPropertiesDialogOpen(true)}
          />
        )}
      </ContextMenu>

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
    </>
  )
}

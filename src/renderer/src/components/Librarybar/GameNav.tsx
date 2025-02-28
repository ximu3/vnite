import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { Nav } from '@ui/nav'
import React from 'react'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { AttributesDialog } from '~/components/Game/Config/AttributesDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayingTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayingTimeEditorDialog'
import { useGameState, useGameLocalState, useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { BatchGameNavCM } from '../GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '../GameBatchEditor/store'

export function GameNav({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  // 保留基本组件状态
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [highlightLocalGames] = useConfigState('game.gameList.highlightLocalGames')
  const [markLocalGames] = useConfigState('game.gameList.markLocalGames')

  // 对话框状态
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  const [isPlayingTimeEditorDialogOpen, setIsPlayingTimeEditorDialogOpen] = React.useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = React.useState(false)

  // 只订阅当前游戏的选中状态和批量模式状态
  const isSelected = useGameBatchEditorStore((state) => state.gameIds.includes(gameId))
  const isBatchMode = useGameBatchEditorStore((state) => state.gameIds.length > 1)

  console.warn('[DEBUG] GameNav')

  const handleGameClick = (event: React.MouseEvent): void => {
    event.preventDefault()

    // 在函数内部获取最新状态和方法，而不是在组件顶层订阅
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
              {/* 内容保持不变... */}
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
                      'icon-[mdi--check-outline] w-[10px] h-[10px] mr-[-6px] flex-shrink-0'
                    )}
                  ></span>
                )}
              </div>
            </Nav>
          </div>
        </ContextMenuTrigger>
        {/* 上下文菜单也可以使用 getState 优化 */}
        {isBatchMode ? (
          <BatchGameNavCM
            gameIds={useGameBatchEditorStore.getState().gameIds}
            openAttributesDialog={() => setIsAttributesDialogOpen(true)}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
          />
        ) : (
          <GameNavCM
            gameId={gameId}
            openAttributesDialog={() => setIsAttributesDialogOpen(true)}
            openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
            openNameEditorDialog={() => setIsNameEditorDialogOpen(true)}
            openPlayingTimeEditorDialog={() => setIsPlayingTimeEditorDialogOpen(true)}
          />
        )}
      </ContextMenu>

      {/* 对话框保持不变... */}
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
    </>
  )
}

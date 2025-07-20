import { Button } from '~/components/ui/button'
import { ContextMenu, ContextMenuTrigger } from '~/components/ui/context-menu'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { BatchGameNavCM } from '~/components/GameBatchEditor/BatchGameNavCM'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { NameEditorDialog } from '~/components/Game/Config/ManageMenu/NameEditorDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { GamePropertiesDialog } from '~/components/Game/Config/Properties'
import { GameImage } from '~/components/ui/game-image'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { useGameRegistry } from '~/stores/game'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { cn, navigateToGame, startGame, stopGame } from '~/utils'

export function BigGamePoster({
  gameId,
  groupId,
  className,
  inViewGames = [] // 添加inViewGames参数，用于Shift多选 - TODO
}: {
  gameId: string
  groupId?: string
  className?: string
  inViewGames?: string[]
}): React.JSX.Element {
  const router = useRouter()
  const gameData = useGameRegistry((state) => state.gameMetaIndex[gameId])
  const runningGames = useRunningGames((state) => state.runningGames)
  const [playTime] = useGameState(gameId, 'record.playTime')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = useState(false)
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false)
  const [showPlayButtonOnPoster] = useConfigState('appearances.showcase.showPlayButtonOnPoster')
  const { t } = useTranslation('game')

  // 批量选择相关状态和方法
  const {
    selectedGamesMap,
    selectGame,
    unselectGame,
    lastSelectedId,
    setLastSelectedId,
    isBatchMode
  } = useGameBatchEditorStore()

  const isSelected = !!selectedGamesMap[gameId]

  // 处理选择游戏
  const handleSelect = (e: React.MouseEvent): void => {
    e.stopPropagation()

    if (e.shiftKey && lastSelectedId && inViewGames.length > 0) {
      // Shift+点击实现连续选择
      const lastIndex = inViewGames.indexOf(lastSelectedId)
      const currentIndex = inViewGames.indexOf(gameId)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const startIndex = Math.min(lastIndex, currentIndex)
        const endIndex = Math.max(lastIndex, currentIndex)

        for (let i = startIndex; i <= endIndex; i++) {
          selectGame(inViewGames[i])
        }
      } else {
        // 如果找不到索引，只选择当前游戏
        selectGame(gameId)
      }
    } else {
      // 常规单击选择
      if (isSelected) {
        unselectGame(gameId)
      } else {
        selectGame(gameId)
        setLastSelectedId(gameId)
      }
    }
  }

  // Ctrl+点击游戏封面时实现多选，而不是导航
  const handleGameClick = (e: React.MouseEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      handleSelect(e)
    } else if (!isSelected) {
      navigateToGame(router, gameId, groupId)
    } else {
      // 如果已选中且不按Ctrl键，仍然选择该游戏（取消其他选择）
      e.stopPropagation()
      selectGame(gameId)
      setLastSelectedId(gameId)
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
              {/* <div className="absolute inset-0 z-10 transition-all duration-300 rounded-lg pointer-events-none bg-background/15 group-hover:bg-transparent" /> */}
              <HoverCardAnimation>
                <GameImage
                  onClick={handleGameClick}
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
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  'overflow-hidden'
                )}
              >
                {/* 多选圆点 */}
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
                          navigateToGame(router, gameId, groupId || 'all')
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

            <div className="text-xs cursor-pointer select-none text-foreground hover:underline decoration-foreground truncate w-[333px] text-center">
              {gameData?.name}
            </div>
          </div>
        </ContextMenuTrigger>
      </div>

      {/* 根据是否处于批量模式切换上下文菜单 */}
      {isBatchMode ? (
        <BatchGameNavCM openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)} />
      ) : (
        <GameNavCM
          gameId={gameId}
          groupId={groupId || 'all'}
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

import { NSFWBlurLevel } from '@appTypes/models'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { GameNavCM } from '~/components/contextMenu/GameNavCM'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { PlayTimeEditorDialog } from '~/components/Game/Config/ManageMenu/PlayTimeEditorDialog'
import { GamePropertiesDialog } from '~/components/Game/Config/Properties'
import { InformationDialog } from '~/components/Game/Overview/Information/InformationDialog'
import { BatchGameNavCM } from '~/components/GameBatchEditor/BatchGameNavCM'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { useDragContext } from '~/components/Showcase/CollectionGames'
import { ContextMenu, ContextMenuTrigger } from '~/components/ui/context-menu'
import { GameImage } from '~/components/ui/game-image'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { useGameCollectionStore, useGameRegistry } from '~/stores/game'
import { cn, navigateToGame } from '~/utils'
import {
  attachClosestEdge,
  calPreviewOffset,
  combine,
  createPortal,
  draggable,
  DropIndicator,
  dropTargetForElements,
  extractClosestEdge,
  invariant,
  setCustomNativeDragPreview,
  type Edge,
  type PreviewState
} from '~/utils/dnd-utills'
import { PlayButton } from './PlayButton'

function Preview({
  title,
  transparentBackground = false
}: {
  title: string
  transparentBackground?: boolean
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative w-[148px] aspect-[2/3] rounded-lg',
        'border-4 border-dashed border-primary',
        !transparentBackground && 'bg-background'
      )}
    >
      <div className="absolute top-[25%] z-20 flex justify-center pointer-events-none w-full h-[50%]">
        <div className="text-accent-foreground text-lg font-semibold w-[90%] text-center break-words whitespace-normal overflow-hidden">
          {title}
        </div>
      </div>
    </div>
  )
}

export function GamePoster({
  gameId,
  groupId,
  className,
  dragScenario,
  parentGap = 0,
  position = 'center',
  inViewGames = [] // TODO: Support shift+click selection
}: {
  gameId: string
  groupId?: string
  className?: string
  dragScenario?: string
  parentGap?: number
  position?: 'right' | 'left' | 'center'
  inViewGames?: string[]
}): React.JSX.Element {
  const navigate = useNavigate()
  const gameData = useGameRegistry((state) => state.gameMetaIndex[gameId])
  const runningGames = useRunningGames((state) => state.runningGames)
  const reorderGamesInCollection = useGameCollectionStore((state) => state.reorderGamesInCollection)
  const collectionId = groupId?.split(':')[1]
  const [playTime] = useGameState(gameId, 'record.playTime')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isPlayTimeEditorDialogOpen, setIsPlayTimeEditorDialogOpen] = useState(false)
  const [isInformationDialogOpen, setIsInformationDialogOpen] = useState(false)
  const [isPropertiesDialogOpen, setIsPropertiesDialogOpen] = useState(false)
  const { t } = useTranslation('game')
  const { setIsDraggingGlobal } = useDragContext()
  const ref_ = useRef<HTMLDivElement>(null)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)
  const [dragging, setDragging] = useState<boolean>(false)
  const [previewState, setPreviewState] = useState<PreviewState>({ type: 'idle' })
  const [showPlayButtonOnPoster] = useConfigState('appearances.showcase.showPlayButtonOnPoster')

  const name = gameData?.name ?? ''
  const stringToBase64 = (str: string): string =>
    btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  const obfuscatedName = stringToBase64(name).slice(0, name.length)

  // Batch mode and selection state
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
      // Shift+Click to select a range
      const lastIndex = inViewGames.indexOf(lastSelectedId)
      const currentIndex = inViewGames.indexOf(gameId)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const startIndex = Math.min(lastIndex, currentIndex)
        const endIndex = Math.max(lastIndex, currentIndex)

        for (let i = startIndex; i <= endIndex; i++) {
          selectGame(inViewGames[i])
        }
      } else {
        // If not found, only select the current game
        selectGame(gameId)
      }
    } else {
      // Regular click selection
      if (isSelected) {
        unselectGame(gameId)
      } else {
        selectGame(gameId)
        setLastSelectedId(gameId)
      }
    }
  }

  // Ctrl+Click to select multiple games instead of navigating
  const handleGameClick = (e: React.MouseEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      handleSelect(e)
    } else {
      navigateToGame(navigate, gameId, groupId || 'all')
    }
  }

  useEffect(() => {
    if (!dragScenario || !collectionId) return
    const el = ref_.current
    invariant(el)
    return combine(
      draggable({
        element: el,
        onGenerateDragPreview({ nativeSetDragImage }) {
          setCustomNativeDragPreview({
            getOffset: calPreviewOffset(0.66, 0.66),
            render({ container }) {
              setPreviewState({ type: 'preview', container })
              return (): void => setPreviewState({ type: 'idle' })
            },
            nativeSetDragImage
          })
        },
        getInitialData: () => ({ dragScenario: dragScenario, uuid: gameId }),
        onDragStart: () => {
          setIsDraggingGlobal(true)
          setDragging(true)
        },
        onDrop: () => {
          setTimeout(() => {
            setIsDraggingGlobal(false)
          }, 500)
          setTimeout(() => {
            setIsDraggingGlobal(true)
          }, 750)
          setTimeout(() => {
            setIsDraggingGlobal(false)
          }, 1000)
          setDragging(false)
        }
      }),
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => source.data.dragScenario === dragScenario,
        getData: ({ input, element }) => {
          // your base data you want to attach to the drop target
          const data = { uuid: gameId }
          // this will 'attach' the closest edge to your `data` object
          return attachClosestEdge(data, { input, element, allowedEdges: ['right', 'left'] })
        },
        onDrag({ self, source }) {
          if (source.element === el) {
            setClosestEdge(null)
            return
          }
          const closestEdge = extractClosestEdge(self.data)
          setClosestEdge(closestEdge)
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ self, source }): void => {
          reorderGamesInCollection(
            collectionId,
            source.data.uuid as string,
            self.data.uuid as string,
            extractClosestEdge(self.data) === 'left' ? 'front' : 'back'
          )
          setClosestEdge(null)
        }
      })
    )
  }, [dragScenario, collectionId, gameId, reorderGamesInCollection, setIsDraggingGlobal])

  return (
    <div ref={ref_} className="relative overflow-visible">
      {dragging ? (
        <Preview title={gameData?.name ?? ''} transparentBackground={true} />
      ) : (
        <ContextMenu>
          <div className="relative">
            <ContextMenuTrigger>
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
                      draggable="false"
                      gameId={gameId}
                      type="cover"
                      blur={nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImage}
                      alt={gameId}
                      className={cn(
                        'w-[148px] aspect-[2/3] cursor-pointer select-none object-cover rounded-lg',
                        className
                      )}
                      fallback={
                        <div
                          className={cn(
                            'w-[148px] aspect-[2/3] cursor-pointer object-cover flex items-center justify-center bg-muted/50',
                            className
                          )}
                          onClick={() => navigateToGame(navigate, gameId, groupId || 'all')}
                        >
                          <div className="p-1 font-bold truncate select-none">{gameName}</div>
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

                <div className="text-xs text-foreground truncate cursor-pointer select-none hover:underline w-[148px] text-center decoration-foreground">
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
              openNameEditorDialog={() => setIsInformationDialogOpen(true)}
              openPlayTimeEditorDialog={() => setIsPlayTimeEditorDialogOpen(true)}
              openPropertiesDialog={() => setIsPropertiesDialogOpen(true)}
            />
          )}
        </ContextMenu>
      )}

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

      {closestEdge && (
        <DropIndicator
          edge={closestEdge}
          gap={closestEdge === position ? '16px' : `${parentGap}px`}
        />
      )}
      {previewState.type === 'preview'
        ? createPortal(<Preview title={gameData?.name ?? ''} />, previewState.container)
        : null}
    </div>
  )
}

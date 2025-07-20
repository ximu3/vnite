import { GameImage } from '~/components/ui/game-image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import { useConfigState, useGameState } from '~/hooks'
import { useGameCollectionStore } from '~/stores'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { cn } from '~/utils'
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

function Preview({
  collectionName,
  collectionLength,
  transparentBackground = false
}: {
  collectionName: string
  collectionLength: number
  transparentBackground?: boolean
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'group relative overflow-hidden w-[155px] h-[155px] rounded-lg',
        'transition-all duration-300 ease-in-out',
        'border-4 border-dashed border-primary',
        !transparentBackground && ' bg-background'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 z-20 mt-7',
          'flex items-center justify-center',
          'pointer-events-none'
        )}
      >
        <div className="flex flex-col items-center justify-center gap-1">
          <div className={cn('text-accent-foreground text-lg font-semibold')}>{collectionName}</div>
          <div className={cn('text-accent-foreground/70')}>{`( ${collectionLength} )`}</div>
        </div>
      </div>
    </div>
  )
}

export function CollectionPoster({
  collectionId,
  className,
  parentGap = 24,
  position = 'center'
}: {
  collectionId: string
  className?: string
  parentGap?: number // Gap(px) between posters
  position?: 'right' | 'left' | 'center' // poster position in the container
}): React.JSX.Element {
  const router = useRouter()
  const collections = useGameCollectionStore((state) => state.documents)
  const reorderCollections = useGameCollectionStore((state) => state.reorderCollections)
  const collectionName = collections[collectionId].name
  const gameId = collections[collectionId].games[0]
  const collectionGames = collections[collectionId].games
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const length = collectionGames.length

  // 批量选择相关状态和方法
  const { selectedGamesMap, selectGames, unselectGames, isBatchMode } = useGameBatchEditorStore()

  // 检查合集中的所有游戏是否都被选中
  const isCollectionFullySelected = (): boolean => {
    if (collectionGames.length === 0) return false

    return collectionGames.every((gameId) => selectedGamesMap[gameId])
  }

  // 检查合集中是否有部分游戏被选中
  const isCollectionPartiallySelected = (): boolean => {
    if (collectionGames.length === 0) return false

    return (
      collectionGames.some((gameId) => selectedGamesMap[gameId]) &&
      !collectionGames.every((gameId) => selectedGamesMap[gameId])
    )
  }

  const isSelected = isCollectionFullySelected()
  const isPartiallySelected = isCollectionPartiallySelected()

  // 处理选择/取消选择合集
  const handleSelect = (e: React.MouseEvent): void => {
    e.stopPropagation()

    if (isSelected) {
      // 如果所有游戏都被选中，则取消选择
      unselectGames(collectionGames)
    } else {
      // 选择合集中的所有游戏
      selectGames(collectionGames)
    }
  }

  // 处理合集点击
  const handleCollectionClick = (e: React.MouseEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      handleSelect(e)
    } else if (isBatchMode && !e.ctrlKey && !e.metaKey) {
      // 在批量模式下点击合集时，选择该合集
      handleSelect(e)
    } else {
      // 默认行为：导航到合集页面
      router.navigate({ to: `/library/collections/${collectionId}` })
    }
  }

  const ref_ = useRef<HTMLDivElement>(null)
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null)
  const [dragging, setDragging] = useState<boolean>(false)
  const [previewState, setPreviewState] = useState<PreviewState>({ type: 'idle' })

  useEffect(() => {
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
        getInitialData: () => ({ dragScenario: 'reorder-collections', uuid: collectionId }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false)
      }),

      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => source.data.dragScenario === 'reorder-collections',
        getData: ({ input, element }) => {
          // your base data you want to attach to the drop target
          const data = { uuid: collectionId }
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
        onDrop({ self, source }) {
          reorderCollections(
            source.data.uuid as string,
            self.data.uuid as string,
            extractClosestEdge(self.data) === 'left' ? 'front' : 'back'
          )
          setClosestEdge(null)
        }
      })
    )
  }, [])

  return (
    <CollectionCM collectionId={collectionId}>
      <div className={cn('group relative rounded-lg')} ref={ref_}>
        {dragging ? (
          <Preview
            collectionLength={length}
            collectionName={collectionName}
            transparentBackground={true}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-[8px] cursor-pointer group">
            <div
              className={cn(
                'rounded-lg shadow-md',
                'transition-all duration-300 ease-in-out',
                isSelected || isPartiallySelected
                  ? 'ring-2'
                  : 'ring-0 ring-border group-hover:ring-2',
                isSelected
                  ? 'ring-primary'
                  : isPartiallySelected
                    ? 'ring-primary/50'
                    : 'group-hover:ring-primary',
                'relative overflow-hidden group'
              )}
              onClick={handleCollectionClick}
            >
              {/* <div className="absolute inset-0 z-10 transition-all duration-300 rounded-lg pointer-events-none bg-background/20 group-hover:bg-transparent" /> */}
              <HoverCardAnimation>
                <GameImage
                  gameId={gameId}
                  type="cover"
                  blur={nsfw && enableNSFWBlur}
                  alt={gameId}
                  className={cn('w-[155px] h-[155px] cursor-pointer object-cover', className)}
                  draggable="false"
                  fallback={
                    <div
                      className={cn(
                        'w-[155px] h-[155px] cursor-pointer object-cover flex items-center justify-center bg-muted/50',
                        className
                      )}
                    ></div>
                  }
                />
              </HoverCardAnimation>

              <div
                className={cn(
                  'absolute inset-x-0 bottom-0 h-full bg-accent/50',
                  'transition-opacity duration-300 ease-in-out',
                  'flex flex-col p-[10px] text-accent-foreground',
                  'transform',
                  isSelected || isPartiallySelected
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100',
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
                      : isPartiallySelected
                        ? 'bg-primary/50 text-primary-foreground'
                        : 'bg-muted/70 hover:bg-muted/90'
                  )}
                  onClick={handleSelect}
                >
                  {isSelected && <span className="icon-[mdi--check] w-3 h-3" />}
                  {isPartiallySelected && <span className="icon-[mdi--minus] w-3 h-3" />}
                </div>

                <div className="absolute inset-0 flex items-center justify-center flex-grow">
                  <div className="text-xl font-semibold">{length}</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-foreground truncate cursor-pointer hover:underline w-[148px] text-center decoration-foreground">
              {collectionName}
            </div>
          </div>
        )}

        {closestEdge && (
          <DropIndicator
            edge={closestEdge}
            gap={closestEdge === position ? '16px' : `${parentGap}px`}
          />
        )}
        {previewState.type === 'preview'
          ? createPortal(
              <Preview collectionLength={length} collectionName={collectionName} />,
              previewState.container
            )
          : null}
      </div>
    </CollectionCM>
  )
}

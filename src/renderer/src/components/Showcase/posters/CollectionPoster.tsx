import { GameImage } from '@ui/game-image'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import { useConfigState, useGameState } from '~/hooks'
import { useGameCollectionStore } from '~/stores'
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
}): JSX.Element {
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
}): JSX.Element {
  const navigate = useNavigate()
  const collections = useGameCollectionStore((state) => state.documents)
  const reorderCollections = useGameCollectionStore((state) => state.reorderCollections)
  const collectionName = collections[collectionId].name
  const gameId = collections[collectionId].games[0]
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const length = collections[collectionId].games.length

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
                'ring-0 ring-border',
                'group-hover:ring-2 group-hover:ring-primary',
                'relative overflow-hidden group'
              )}
              onClick={() => navigate(`/library/collections/${collectionId}`)}
            >
              <div className="absolute inset-0 z-10 transition-all duration-300 rounded-lg pointer-events-none bg-background/20 group-hover:bg-transparent" />
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
                        'w-full h-full cursor-pointer object-cover flex items-center justify-center',
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
                  'opacity-0 group-hover:opacity-100',
                  'overflow-hidden'
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center flex-grow">
                  <div className="text-xl font-semibold">{length}</div>
                </div>
              </div>
            </div>
            <div className="text-[13px] text-foreground truncate cursor-pointer hover:underline w-[148px] text-center decoration-foreground">
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

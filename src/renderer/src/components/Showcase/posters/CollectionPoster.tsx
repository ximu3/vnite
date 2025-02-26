import { GameImage } from '@ui/game-image'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HoverSquareCardAnimation } from '~/components/animations/HoverSquareCard'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
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
  collectionLength
}: {
  collectionName: string
  collectionLength: number
}): JSX.Element {
  return (
    <div
      className={cn(
        'group relative overflow-hidden w-[160px] h-[160px] rounded-lg',
        'transition-all duration-300 ease-in-out',
        '3xl:w-[190px] 3xl:h-[190px]',
        'border-4 border-dashed border-primary bg-background'
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
  parentGap?: number
  position?: 'right' | 'left' | 'center'
}): JSX.Element {
  const navigate = useNavigate()
  const { documents: collections, reorderCollections } = useGameCollectionStore()
  const collectionName = collections[collectionId].name
  const gameId = collections[collectionId].games[0]
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
          <Preview collectionLength={length} collectionName={collectionName} />
        ) : (
          <div
            className={cn(
              'overflow-hidden shadow-custom-initial cursor-pointer w-[160px] h-[160px] rounded-lg',
              'transition-all duration-300 ease-in-out',
              'ring-0 ring-transparent',
              'hover:ring-2 hover:ring-primary',
              '3xl:w-[190px] 3xl:h-[190px]'
            )}
            onClick={() => navigate(`/library/collections/${collectionId}`)}
          >
            {/* background mask layer */}
            <div
              className={cn(
                'absolute inset-0 bg-muted/40 backdrop-blur-sm z-10 rounded-lg pointer-events-none'
              )}
            />

            {/* HoverBigCardAnimation layer */}
            <div className="relative z-0 w-full h-full">
              <HoverSquareCardAnimation className={cn('rounded-lg w-full h-full')}>
                <GameImage
                  gameId={gameId}
                  type="cover"
                  alt={gameId}
                  className={cn(
                    'w-full h-full cursor-pointer object-cover',
                    '3xl:w-full 3xl:h-full',
                    className
                  )}
                  draggable="false"
                  fallback={
                    <div
                      className={cn(
                        'w-full h-full cursor-pointer object-cover flex items-center justify-center',
                        '3xl:w-full 3xl:h-full',
                        className
                      )}
                    ></div>
                  }
                />
              </HoverSquareCardAnimation>
            </div>

            {/* text content layer */}
            <div
              className={cn(
                'absolute inset-0 z-20 mt-4 rounded-lg',
                'flex items-center justify-center',
                'pointer-events-none w-full h-full'
              )}
            >
              <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                <div
                  className={cn(
                    'text-accent-foreground text-lg font-semibold',
                    'w-[90%] break-words whitespace-normal text-center',
                    'max-h-[50%] overflow-hidden'
                  )}
                >
                  {collectionName}
                </div>

                <div className={cn('text-accent-foreground/70')}>{`( ${length} )`}</div>
              </div>
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

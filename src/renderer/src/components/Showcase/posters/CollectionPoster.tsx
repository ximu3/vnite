import { HoverSquareCardAnimation } from '~/components/animations/HoverSquareCard'
import { cn } from '~/utils'
import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

import invariant from 'tiny-invariant'
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@ui/drop-indicator'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { centerUnderPointer } from '@atlaskit/pragmatic-drag-and-drop/element/center-under-pointer'
import { createPortal } from 'react-dom'

import { useCollections } from '~/hooks'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import { GameImage } from '@ui/game-image'

type PreviewState =
  | {
      type: 'idle'
    }
  | {
      type: 'preview'
      container: HTMLElement
    }

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
        <div className="flex flex-col gap-1 items-center justify-center">
          <div className={cn('text-accent-foreground text-lg font-semibold')}>{collectionName}</div>
          <div className={cn('text-accent-foreground/70')}>{`( ${collectionLength} )`}</div>
        </div>
      </div>
    </div>
  )
}

export function CollectionPoster({
  collectionId,
  className
}: {
  collectionId: string
  className?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { collections, reorderCollections } = useCollections()
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
            getOffset: (container) => {
              const half = centerUnderPointer(container)
              return { x: (half.x * 4) / 3, y: (half.y * 4) / 3 }
            },
            render({ container }) {
              setPreviewState({ type: 'preview', container })
              return (): void => setPreviewState({ type: 'idle' })
            },
            nativeSetDragImage
          })
        },
        getInitialData: () => ({ collectionId }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false)
      }),
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          // your base data you want to attach to the drop target
          const data = {
            id: collectionId
          }
          // this will 'attach' the closest edge to your `data` object
          return attachClosestEdge(data, {
            input,
            element,
            allowedEdges: ['right', 'left']
          })
        },
        onDrag({ self, source }) {
          const isSource = source.element === el
          if (isSource) {
            setClosestEdge(null)
            return
          }
          const closestEdge = extractClosestEdge(self.data)
          setClosestEdge(closestEdge)
        },
        onDragLeave() {
          setClosestEdge(null)
        },
        onDrop({ self, source }) {
          reorderCollections(
            source.data.collectionId as string,
            self.data.id as string,
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
                'absolute inset-0 z-20 mt-7 rounded-lg',
                'flex items-center justify-center',
                'pointer-events-none'
              )}
            >
              <div className="flex flex-col gap-1 items-center justify-center">
                <div className={cn('text-accent-foreground text-lg font-semibold')}>
                  {collectionName}
                </div>
                <div className={cn('text-accent-foreground/70')}>{`( ${length} )`}</div>
              </div>
            </div>
          </div>
        )}

        {closestEdge && <DropIndicator edge={closestEdge} gap="24px" />}
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

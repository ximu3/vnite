import { ScrollArea } from '@ui/scroll-area'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { GamePoster } from './posters/GamePoster'

export type DragContextType = {
  isDraggingGlobal: boolean
  setIsDraggingGlobal: (dragging: boolean) => void
}

const DragContext = createContext<DragContextType | null>(null)

export const useDragContext = (): DragContextType => {
  const context = useContext(DragContext)
  return (
    context ?? {
      isDraggingGlobal: false,
      setIsDraggingGlobal: (): void => {}
    }
  )
}

export function CollectionGamesComponent({
  collectionId,
  scrollPosition
}: {
  collectionId: string
  scrollPosition: { x: number; y: number }
}): JSX.Element {
  const collections = useGameCollectionStore((state) => state.documents)
  const games = collections[collectionId].games
  const collectionName = collections[collectionId].name

  const [gap, setGap] = useState<number>(0)
  const [columns, setColumns] = useState<number>(0)
  const gridContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const calculateGap = (): void => {
      const gridContainer = gridContainerRef.current
      if (gridContainer) {
        const containerWidth = gridContainer.offsetWidth
        const gridItems = gridContainer.children
        if (gridItems.length === 0) return

        const itemWidth = (gridItems[0] as HTMLDivElement).offsetWidth
        const containerStyle = window.getComputedStyle(gridContainer)
        const minGap = parseFloat(containerStyle.getPropertyValue('column-gap'))
        const pL = parseFloat(containerStyle.paddingLeft)
        const pR = parseFloat(containerStyle.paddingRight)

        const columns = Math.floor((containerWidth - pL - pR + minGap) / (itemWidth + minGap))
        setColumns(columns)
        if (columns > 1) {
          const gapTrue = (containerWidth - pL - pR - columns * itemWidth) / (columns - 1)
          setGap(gapTrue)
        }
      }
    }

    calculateGap()
    const observer = new ResizeObserver(calculateGap)
    const gridContainer = gridContainerRef.current
    if (gridContainer) {
      observer.observe(gridContainer)
    }

    return (): void => observer.disconnect()
  }, [])

  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)

  return (
    <DragContext.Provider value={{ isDraggingGlobal, setIsDraggingGlobal }}>
      <div className={cn('flex flex-col gap-3 h-[100vh] pt-[50px] bg-background/50')}>
        <ScrollArea className={cn('w-full')}>
          <div className={cn('w-full flex flex-col gap-1 pt-3')}>
            <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
              <div className={cn('text-accent-foreground flex-shrink-0')}>{collectionName}</div>

              {/* Split Line Container */}
              <div className={cn('flex items-center justify-center flex-grow')}>
                <div className="w-full h-px border-t border-dashed border-border" />
              </div>
            </div>

            {/* Game List Container */}
            <div
              ref={gridContainerRef}
              className={cn(
                'grid grid-cols-[repeat(auto-fill,148px)]',
                '3xl:grid-cols-[repeat(auto-fill,176px)]',
                'justify-between gap-6 gap-y-[30px] w-full',
                'pt-2 pb-6 pl-5 pr-5' // Add inner margins to show shadows
              )}
            >
              {games.map((gameId, index) => (
                <div
                  key={gameId}
                  className={cn(
                    'flex-shrink-0' // Preventing compression
                  )}
                >
                  <LazyLoadComponent threshold={300} scrollPosition={scrollPosition}>
                    <GamePoster
                      gameId={gameId}
                      groupId={`collection:${collectionId}`}
                      dragScenario="reorder-games-in-collection"
                      parentGap={gap}
                      position={
                        (index % columns === 0 && 'left') ||
                        (index % columns === columns - 1 && 'right') ||
                        'center'
                      }
                    />
                  </LazyLoadComponent>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        {/* This spacer prevents the last row of posters from being cut off
        and enables downward auto-scrolling when dragging near the bottom. */}
        <div className="h-5" />
      </div>
    </DragContext.Provider>
  )
}

export const CollectionGames = trackWindowScroll(CollectionGamesComponent)

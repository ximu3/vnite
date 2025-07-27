import { SeparatorDashed } from '@ui/separator-dashed'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { GamePoster } from './posters/GamePoster'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'

export type DragContextType = {
  isDraggingGlobal: boolean
  setIsDraggingGlobal: (dragging: boolean) => void
}

const DragContext = createContext<DragContextType | null>(null)

// eslint-disable-next-line
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
}): React.JSX.Element {
  const collections = useGameCollectionStore((state) => state.documents)
  const games = collections[collectionId]?.games
  const collectionName = collections[collectionId]?.name

  const [gap, setGap] = useState<number>(0)
  const [columns, setColumns] = useState<number>(0)
  const gridContainerRef = useRef<HTMLDivElement | null>(null)

  const selectGames = useGameBatchEditorStore((state) => state.selectGames)

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Check if any dialog element is active
      const isDialogActive =
        document.querySelector('dialog[open]') !== null ||
        document.querySelector('.modal.active') !== null ||
        document.querySelector('[role="dialog"]') !== null

      // When a dialog is open, do not execute shortcut key functions
      if (isDialogActive) {
        return
      }

      // Ctrl + A select all games
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        selectGames(games)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectGames, collections])

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
      <div className={cn('flex flex-col gap-3 h-full bg-transparent')}>
        <ScrollArea className={cn('w-full h-full pb-2')}>
          <div className={cn('w-full flex flex-col gap-1 pt-[18px]')}>
            <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
              <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
                {collectionName}
              </div>

              <SeparatorDashed className="border-border" />
            </div>

            {/* Game List Container */}
            <div
              ref={gridContainerRef}
              className={cn(
                'grid grid-cols-[repeat(auto-fill,148px)]',
                // '3xl:grid-cols-[repeat(auto-fill,176px)]',
                'justify-between gap-6 gap-y-[30px] w-full',
                'pt-2 pb-6 pl-5 pr-5' // Add inner margins to show shadows
              )}
            >
              {games?.map((gameId, index) => (
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
      </div>
    </DragContext.Provider>
  )
}

export const CollectionGames = trackWindowScroll(CollectionGamesComponent)

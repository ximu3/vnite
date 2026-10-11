import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'

import { GAME_SORT_FIELDS, NSFWFilterMode } from '@appTypes/models'
import { ScrollArea } from '@ui/scroll-area'
import { SeparatorDashed } from '@ui/separator-dashed'
import {
  GameSortFieldSelect,
  SecondarySortControl,
  SortDirectionButton
} from '~/components/Game/GameSortControl'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { useConfigState } from '~/hooks'
import { useGameCollectionState } from '~/hooks/useGameCollectionState'
import { useGameCollectionStore } from '~/stores'
import { sortGames, useVisibleGameIds } from '~/stores/game'
import { cn } from '~/utils'
import { GamePoster } from './posters/GamePoster'
import { PlaceHolder } from './posters/PlaceHolder'
import { ScrollToTopButton } from './ScrollToTopButton'

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
  const [by, setBy] = useGameCollectionState(collectionId, 'sortBy')
  const [order, setOrder] = useGameCollectionState(collectionId, 'sortOrder')
  const [secondarySort, setSecondarySort] = useGameCollectionState(collectionId, 'secondarySort')
  const { t } = useTranslation('game')
  const collections = useGameCollectionStore((state) => state.documents)
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const games = useVisibleGameIds(collections[collectionId]?.games)
  const sortedGames =
    by === 'custom' ? games : sortGames({ by, order, secondary: secondarySort }, games)
  const collectionName = collections[collectionId]?.name

  const [gap, setGap] = useState<number>(0)
  const [columns, setColumns] = useState<number>(0)
  const gridContainerRef = useRef<HTMLDivElement | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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
  }, [selectGames, games])

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
      <div className={cn('flex flex-col gap-3 h-full bg-transparent pt-4')}>
        <div className={cn('flex flex-row gap-5 items-center justify-center pl-5 pt-2')}>
          <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
            {collectionName}
          </div>
          <div className={cn('flex flex-row gap-1 items-center justify-center select-none')}>
            <div className={cn('text-sm')}>{t('showcase.sorting.title')}</div>
            {/* Sort By */}
            <GameSortFieldSelect
              value={by}
              fields={[...GAME_SORT_FIELDS, 'custom']}
              triggerClassName={cn('w-[130px] h-[26px] text-xs border-0')}
              onValueChange={(nextBy) => {
                void (async () => {
                  await setBy(nextBy)
                  if (nextBy === 'custom' || secondarySort?.by === nextBy) {
                    await setSecondarySort(null)
                  }
                })()
              }}
            />
          </div>
          {/* Toggle Order */}
          {by !== 'custom' && (
            <SortDirectionButton
              order={order}
              className={cn('h-[26px] w-[26px] -ml-3')}
              onOrderChange={(nextOrder) => {
                void setOrder(nextOrder)
              }}
            />
          )}
          {by !== 'custom' && (
            <SecondarySortControl
              primaryBy={by}
              value={secondarySort}
              fields={GAME_SORT_FIELDS}
              onValueChange={(value) => {
                void setSecondarySort(value)
              }}
            />
          )}
          <SeparatorDashed className="border-border" />
        </div>
        <ScrollArea ref={scrollAreaRef} className={cn('w-full flex-1 min-h-0 pb-2')}>
          <div className={cn('w-full flex flex-col gap-1')}>
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
              {sortedGames?.map((gameId, index) => (
                <div
                  key={`${gameId}_${nsfwFilterMode}`}
                  className={cn(
                    'flex-shrink-0' // Preventing compression
                  )}
                >
                  <LazyLoadComponent
                    threshold={300}
                    scrollPosition={scrollPosition}
                    placeholder={<PlaceHolder />} // Necessary for scroll restoration
                  >
                    <GamePoster
                      gameId={gameId}
                      groupId={`collection:${collectionId}`}
                      dragScenario={
                        by === 'custom' && nsfwFilterMode === NSFWFilterMode.All
                          ? 'reorder-games-in-collection'
                          : undefined
                      }
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
        <ScrollToTopButton scrollAreaRef={scrollAreaRef} />
      </div>
    </DragContext.Provider>
  )
}

export const CollectionGames = trackWindowScroll(CollectionGamesComponent)

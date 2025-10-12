import { NSFWFilterMode } from '@appTypes/models'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { SeparatorDashed } from '@ui/separator-dashed'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useGameBatchEditorStore } from '~/components/GameBatchEditor/store'
import { Button } from '~/components/ui/button'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useConfigState } from '~/hooks'
import { useGameCollectionState } from '~/hooks/useGameCollectionState'
import { useGameCollectionStore } from '~/stores'
import { filterGamesByNSFW, sortGames } from '~/stores/game/gameUtils'
import { cn } from '~/utils'
import { GamePoster } from './posters/GamePoster'

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
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }
  const { t } = useTranslation('game')
  const collections = useGameCollectionStore((state) => state.documents)
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')

  const games = filterGamesByNSFW(nsfwFilterMode, collections[collectionId]?.games)
  const sortedGames = by === 'custom' ? games : sortGames(by, order, games)
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
        <div className={cn('flex flex-row gap-5 items-center justify-center pl-5 pt-2')}>
          <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
            {collectionName}
          </div>
          <div className={cn('flex flex-row gap-1 items-center justify-center select-none')}>
            <div className={cn('text-sm')}>{t('showcase.sorting.title')}</div>
            {/* Sort By */}
            <Select value={by} onValueChange={setBy} defaultValue="name">
              <SelectTrigger className={cn('w-[130px] h-[26px] text-xs border-0')}>
                <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('showcase.sorting.label')}</SelectLabel>
                  <SelectItem value="metadata.name">
                    {t('showcase.sorting.options.name')}
                  </SelectItem>
                  <SelectItem value="metadata.sortName">
                    {t('showcase.sorting.options.sortName')}
                  </SelectItem>
                  <SelectItem value="metadata.releaseDate">
                    {t('showcase.sorting.options.releaseDate')}
                  </SelectItem>
                  <SelectItem value="record.lastRunDate">
                    {t('showcase.sorting.options.lastRunDate')}
                  </SelectItem>
                  <SelectItem value="record.addDate">
                    {t('showcase.sorting.options.addDate')}
                  </SelectItem>
                  <SelectItem value="record.playTime">
                    {t('showcase.sorting.options.playTime')}
                  </SelectItem>
                  <SelectItem value="custom">{t('showcase.sorting.options.custom')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {/* Toggle Order */}
          {by !== 'custom' && (
            <Button
              variant={'thirdary'}
              size={'icon'}
              className={cn('h-[26px] w-[26px] -ml-3')}
              onClick={toggleOrder}
            >
              {order === 'asc' ? (
                <span className={cn('icon-[mdi--arrow-up] w-4 h-4')}></span>
              ) : (
                <span className={cn('icon-[mdi--arrow-down] w-4 h-4')}></span>
              )}
            </Button>
          )}
          <SeparatorDashed className="border-border" />
        </div>
        <ScrollArea className={cn('w-full flex-1 min-h-0 pb-2')}>
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
                  <LazyLoadComponent threshold={300} scrollPosition={scrollPosition}>
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
      </div>
    </DragContext.Provider>
  )
}

export const CollectionGames = trackWindowScroll(CollectionGamesComponent)

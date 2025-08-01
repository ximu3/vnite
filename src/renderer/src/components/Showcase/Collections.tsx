import { Button } from '~/components/ui/button'
import { throttle } from 'lodash'
import { useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { CollectionPoster } from './posters/CollectionPoster'
import { SeparatorDashed } from '@ui/separator-dashed'

export function Collections(): React.JSX.Element {
  const collections = useGameCollectionStore((state) => state.documents)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const scroll = throttle((direction: 'left' | 'right'): void => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 872
    const container = scrollContainerRef.current
    container.scrollTo({
      left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    })
  }, 750)

  // Sort collections by the sort field
  const sortedCollectionIds = useMemo(() => {
    return Object.values(collections)
      .sort((a, b) => a.sort - b.sort)
      .map((collection) => collection._id)
  }, [collections])

  const { t } = useTranslation('game')

  return (
    <div className={cn('w-[calc(100vw-327px)] flex flex-col gap-1')}>
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
          {t('showcase.sections.collections')}
        </div>
        <SeparatorDashed className="border-border" />
        <div className={cn('flex flex-row gap-2 items-center justify-center pr-5')}>
          <Button
            className={cn('hover:bg-transparent p-0 -mt-2 -mb-2')}
            variant={'ghost'}
            size={'icon'}
            onClick={() => scroll('left')}
          >
            <span className={cn('icon-[mdi--keyboard-arrow-left] w-6 h-6')}></span>
          </Button>
          <Button
            className={cn('hover:bg-transparent p-0 -mt-2 -mb-2')}
            variant={'ghost'}
            size={'icon'}
            onClick={() => scroll('right')}
          >
            <span className={cn('icon-[mdi--keyboard-arrow-right] w-6 h-6')}></span>
          </Button>
        </div>
      </div>
      {/* Game List Container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex flex-row gap-8 grow',
          'w-full overflow-x-auto scrollbar-none scroll-smooth',
          'pt-3 pb-6 pl-5 pr-5' // Add inner margins to show shadows
        )}
      >
        {/* Render using the sorted ID array */}
        {sortedCollectionIds.map((collectionId, index) => (
          <div
            key={collectionId}
            className={cn(
              'flex-shrink-0' // Preventing compression
            )}
          >
            <CollectionPoster
              collectionId={collectionId}
              parentGap={32} // Gap(px) between posters
              position={
                (index === 0 && 'left') ||
                (index === sortedCollectionIds.length - 1 && 'right') ||
                'center'
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

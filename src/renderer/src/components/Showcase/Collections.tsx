import { Button } from '@ui/button'
import { throttle } from 'lodash'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { CollectionPoster } from './posters/CollectionPoster'

export function Collections(): JSX.Element {
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
  const { t } = useTranslation('game')
  return (
    <div className={cn('w-full flex flex-col gap-1')}>
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('text-accent-foreground flex-shrink-0')}>
          {t('showcase.sections.collections')}
        </div>

        {/* Split Line Container */}
        <div className={cn('flex items-center justify-center flex-grow')}>
          <div className="w-full h-px pr-3 border-t border-dashed border-border" />
        </div>

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
        {/* The wrapper ensures that each Poster maintains a fixed width */}
        {Object.keys(collections).map((collectionId, index) => (
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
                (index === Object.keys(collections).length - 1 && 'right') ||
                'center'
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}

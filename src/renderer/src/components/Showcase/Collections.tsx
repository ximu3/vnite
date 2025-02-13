import { cn } from '~/utils'
import { Separator } from '@ui/separator'
import { Button } from '@ui/button'
import { useCollections } from '~/hooks'
import { CollectionPoster } from './posters/CollectionPoster'
import { useRef } from 'react'
import { throttle } from 'lodash'

export function Collections(): JSX.Element {
  const { collections } = useCollections()

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
  return (
    <div className={cn('w-full flex flex-col gap-1 pt-3')}>
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('text-accent-foreground flex-shrink-0')}>我的收藏</div>

        {/* Split Line Container */}
        <div className={cn('flex items-center justify-center flex-grow pr-5')}>
          <Separator className={cn('flex-grow')} />
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
          'flex flex-row gap-6 grow',
          'w-full overflow-x-auto scrollbar-none scroll-smooth',
          'pt-2 pb-6 pl-5 pr-5' // Add inner margins to show shadows
        )}
      >
        {/* The wrapper ensures that each Poster maintains a fixed width */}
        {Object.keys(collections).map((collectionId) => (
          <div
            key={collectionId}
            className={cn(
              'flex-shrink-0' // Preventing compression
            )}
          >
            <CollectionPoster collectionId={collectionId} />
          </div>
        ))}
      </div>
    </div>
  )
}

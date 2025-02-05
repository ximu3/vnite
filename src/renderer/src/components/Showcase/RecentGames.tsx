import { cn } from '~/utils'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { useGameIndexManager } from '~/hooks'
import { GamePoster } from './posters/GamePoster'
import { BigGamePoster } from './posters/BigGamePoster'
import { useRef } from 'react'

export function RecentGames(): JSX.Element {
  const { sort: sortGames } = useGameIndexManager()
  const games = sortGames('lastRunDate', 'desc')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right'): void => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 872
    const container = scrollContainerRef.current
    container.scrollTo({
      left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    })
  }
  return (
    <div className={cn('w-full flex flex-col gap-1 pt-3')}>
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('text-accent-foreground flex-shrink-0')}>最近游戏</div>

        {/* Split Line Container */}
        <div className={cn('flex items-center justify-center flex-grow')}>
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
          'pt-2 pb-6 pl-5' // Add inner margins to show shadows
        )}
      >
        {/* The wrapper ensures that each Poster maintains a fixed width */}
        {games.map((game, index) =>
          index === 0 ? (
            <div
              key={game}
              className={cn(
                'flex-shrink-0' // Preventing compression
              )}
            >
              <BigGamePoster gameId={game} groupId="recentGames" />
            </div>
          ) : (
            <div
              key={game}
              className={cn(
                'flex-shrink-0' // Preventing compression
              )}
            >
              {index < 5 ? (
                <GamePoster gameId={game} groupId="recentGames" />
              ) : (
                <GamePoster gameId={game} />
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

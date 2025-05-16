import { Button } from '@ui/button'
import { throttle } from 'lodash'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { BigGamePoster } from './posters/BigGamePoster'
import { GamePoster } from './posters/GamePoster'

export function RecentGames(): JSX.Element {
  const games = sortGames('record.lastRunDate', 'desc').slice(0, 15)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showRecentGamesInGameList] = useConfigState('game.gameList.showRecentGames')

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
        <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
          {t('showcase.sections.recentGames')}
        </div>

        {/* Split Line Container */}
        <div className={cn('flex items-center justify-center flex-grow')}>
          <div className="w-full h-px border-t border-dashed border-border" />
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
          'pt-3 pb-6 pl-5 pr-5' // Add inner margins to show shadows
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
              {showRecentGamesInGameList ? (
                <BigGamePoster className="" gameId={game} groupId="recentGames" />
              ) : (
                <BigGamePoster gameId={game} />
              )}
            </div>
          ) : (
            <div
              key={game}
              className={cn(
                'flex-shrink-0' // Preventing compression
              )}
            >
              {index < 5 && showRecentGamesInGameList ? (
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

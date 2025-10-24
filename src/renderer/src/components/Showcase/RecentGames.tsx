import { SeparatorDashed } from '@ui/separator-dashed'
import { throttle } from 'lodash'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { useConfigState } from '~/hooks'
import { useLibraryStore } from '~/pages/Library/store'
import { filterGamesByNSFW, getGameStore, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { BigGamePoster } from './posters/BigGamePoster'
import { GamePoster } from './posters/GamePoster'

export function RecentGames(): React.JSX.Element {
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const games = sortGames('record.lastRunDate', 'desc', filterGamesByNSFW(nsfwFilterMode))
    .slice(0, 15)
    .filter((id) => {
      const date = getGameStore(id).getState().getValue('record.lastRunDate')
      return date && date !== ''
    })
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showRecentGamesInGameList] = useConfigState('game.gameList.showRecentGames')
  const libraryBarWidth = useLibraryStore((state) => state.libraryBarWidth)

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
    <div
      className={cn('flex flex-col gap-1')}
      style={{ width: `calc(100vw - ${libraryBarWidth + 60 - (libraryBarWidth === 0 ? 1 : 0)}px)` }}
    >
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
          {t('showcase.sections.recentGames')}
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
          'flex flex-row gap-6 grow',
          'w-full overflow-x-auto scrollbar-none scroll-smooth',
          'pt-3 pb-6 pl-5 pr-5' // Add inner margins to show shadows
        )}
      >
        {/* The wrapper ensures that each Poster maintains a fixed width */}
        {games.length === 0 && (
          <div className="text-muted-foreground text-sm">{t('list.recent.empty')}</div>
        )}
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

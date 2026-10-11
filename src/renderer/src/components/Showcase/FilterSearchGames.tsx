import { GAME_SORT_FIELDS } from '@appTypes/models'
import { ScrollArea } from '@ui/scroll-area'
import { SeparatorDashed } from '@ui/separator-dashed'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import {
  GameSortFieldSelect,
  SecondarySortControl,
  SortDirectionButton
} from '~/components/Game/GameSortControl'
import { useConfigState } from '~/hooks'
import { filterGames, searchGames, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { useFilterStore } from '../Librarybar/Filter/store'
import { useLibrarybarStore } from '../Librarybar/store'
import { GamePoster } from './posters/GamePoster'

export function FilterSearchGamesComponent({
  scrollPosition,
  mode
}: {
  scrollPosition: { x: number; y: number }
  mode: 'filter' | 'search'
}): React.JSX.Element {
  const query = useLibrarybarStore((state) => state.query)
  const { filter } = useFilterStore()
  const [sort, setSort] = useConfigState('game.showcase.sort')
  const games = sortGames(sort, mode === 'filter' ? filterGames(filter) : searchGames(query))
  const { t } = useTranslation('game')
  return (
    <div className={cn('flex flex-col gap-3 h-full bg-transparent')}>
      <div className={cn('flex flex-row gap-5 items-center justify-center pl-5 pt-2')}>
        <div className={cn('text-accent-foreground select-none flex-shrink-0')}>
          {t(`list.${mode}.results`)}
        </div>
        <div className={cn('flex flex-row gap-1 items-center justify-center select-none')}>
          <div className={cn('text-sm')}>{t('showcase.sorting.title')}</div>
          {/* Sort By */}
          <GameSortFieldSelect
            value={sort.by}
            fields={GAME_SORT_FIELDS}
            triggerClassName={cn('w-[130px] h-[26px] text-xs border-0')}
            onValueChange={(by) => {
              void setSort({
                ...sort,
                by,
                secondary: sort.secondary?.by === by ? null : sort.secondary
              })
            }}
          />
        </div>
        {/* Toggle Order */}
        <SortDirectionButton
          order={sort.order}
          className={cn('h-[26px] w-[26px] -ml-3')}
          onOrderChange={(order) => {
            void setSort({ ...sort, order })
          }}
        />
        <SecondarySortControl
          primaryBy={sort.by}
          value={sort.secondary}
          fields={GAME_SORT_FIELDS}
          onValueChange={(secondary) => {
            void setSort({ ...sort, secondary })
          }}
        />
        <SeparatorDashed className="border-border" />
      </div>
      <ScrollArea className={cn('w-full flex-1 min-h-0 pb-2')}>
        <div className={cn('w-full flex flex-col gap-1')}>
          {/* Game List Container */}
          <div
            className={cn(
              'grid grid-cols-[repeat(auto-fill,148px)]',
              // '3xl:grid-cols-[repeat(auto-fill,176px)]',
              'justify-between gap-6 gap-y-[30px] w-full',
              'pt-2 pb-6 pl-5 pr-5' // Add inner margins to show shadows
            )}
          >
            {games?.map((gameId) => (
              <div
                key={gameId}
                className={cn(
                  'flex-shrink-0' // Preventing compression
                )}
              >
                <LazyLoadComponent threshold={300} scrollPosition={scrollPosition}>
                  <GamePoster gameId={gameId} groupId={'0'} />
                </LazyLoadComponent>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export const FilterSearchGames = trackWindowScroll(FilterSearchGamesComponent)

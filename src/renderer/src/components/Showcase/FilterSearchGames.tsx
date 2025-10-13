import { Button } from '@ui/button'
import { ScrollArea } from '@ui/scroll-area'
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
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
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
  const [by, setBy] = useConfigState('game.showcase.sort.by')
  const [order, setOrder] = useConfigState('game.showcase.sort.order')
  const games = sortGames(by, order, mode === 'filter' ? filterGames(filter) : searchGames(query))
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }
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
          <Select value={by} onValueChange={setBy} defaultValue="name">
            <SelectTrigger className={cn('w-[130px] h-[26px] text-xs border-0')}>
              <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('showcase.sorting.label')}</SelectLabel>
                <SelectItem value="metadata.name">{t('showcase.sorting.options.name')}</SelectItem>
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
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {/* Toggle Order */}
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

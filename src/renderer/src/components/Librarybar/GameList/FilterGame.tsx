import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useConfigState } from '~/hooks'
import { filterGames, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { useFilterStore } from '../Filter/store'
import { GameNav } from '../GameNav'
import { PlaceHolder } from './PlaceHolder'

export function FilterGameComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const { filter } = useFilterStore()
  const games = sortGames(by, order, filterGames(filter))
  const { t } = useTranslation('game')
  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3 pb-1')}>
      <Accordion
        type="multiple"
        defaultValue={['filter']}
        className={cn('w-full text-xs flex flex-col gap-2')}
      >
        <AccordionItem value="filter">
          <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
            {t('list.filter.results')}
          </AccordionTrigger>
          <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
            {games.length !== 0 ? (
              games.map((game) => (
                <LazyLoadComponent
                  key={game}
                  threshold={300}
                  scrollPosition={scrollPosition}
                  placeholder={<PlaceHolder gameId={game} groupId={'0'} />}
                >
                  <GameNav key={game} gameId={game} groupId={'0'} />
                </LazyLoadComponent>
              ))
            ) : (
              <div className={cn('text-center text-xs mt-2')}>{t('list.filter.noResults')}</div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  )
}

export const FilterGame = trackWindowScroll(FilterGameComponent)

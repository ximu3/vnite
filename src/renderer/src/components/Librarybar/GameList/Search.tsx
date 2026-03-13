import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useConfigState } from '~/hooks'
import { searchGames, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { PlaceHolder } from './PlaceHolder'

export function SearchComponent({
  query,
  scrollPosition
}: {
  query: string
  scrollPosition: { x: number; y: number }
}): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const { t } = useTranslation('game')
  const games = sortGames(by, order, searchGames(query))
  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3 pt-1 pb-1')}>
      <Accordion
        type="multiple"
        defaultValue={['all']}
        className={cn('w-full text-xs flex flex-col gap-2')}
      >
        <AccordionItem value="all">
          <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
            {t('list.search.results')}
          </AccordionTrigger>
          <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
            {games.map((game) => (
              <LazyLoadComponent
                key={game}
                threshold={300}
                scrollPosition={scrollPosition}
                placeholder={<PlaceHolder gameId={game} groupId={'0'} />}
              >
                <GameNav key={game} gameId={game} groupId={'0'} />
              </LazyLoadComponent>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  )
}
export const Search = trackWindowScroll(SearchComponent)

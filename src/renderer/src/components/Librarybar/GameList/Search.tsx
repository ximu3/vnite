import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { searchGames, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'

export function Search({ query }: { query: string }): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const { t } = useTranslation('game')
  const games = sortGames(by, order, searchGames(query))
  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3')}>
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
              <GameNav key={game} gameId={game} groupId={'0'} />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  )
}

import { cn } from '~/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { GameNav } from '../GameNav'
import { useFilterStore } from '../Filter/store'
import { filterGames } from '~/stores/game'

export function FilterGame(): JSX.Element {
  const { filter } = useFilterStore()
  const games = filterGames(filter)
  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3')}>
      <Accordion
        type="multiple"
        defaultValue={['filter']}
        className={cn('w-full text-xs flex flex-col gap-2')}
      >
        <AccordionItem value="filter">
          <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
            筛选结果
          </AccordionTrigger>
          <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
            {games.length !== 0 ? (
              games.map((game) => <GameNav key={game} gameId={game} groupId={'0'} />)
            ) : (
              <div className={cn('text-center text-xs mt-2')}>没有找到符合条件的游戏</div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ScrollArea>
  )
}

import { cn } from '~/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { useCollections } from '~/hooks'
import { ScrollArea } from '@ui/scroll-area'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'

export function Collection(): JSX.Element {
  const { collections } = useCollections()
  return (
    <ScrollArea className={cn('w-full h-full')}>
      <Accordion type="multiple" className={cn('w-full text-xs flex flex-col gap-2 ')}>
        <AllGame />
        {Object.entries(collections).map(([key, value]) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2 rounded-none')}>
              {value.name}
            </AccordionTrigger>
            <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
              {value.games.map((game) => (
                <GameNav key={game} gameId={game} groupId={`collection:${key}`} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  )
}

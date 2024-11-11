import { cn } from '~/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { useCollections } from '~/hooks'
import { ScrollArea } from '@ui/scroll-area'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'

export function Collection(): JSX.Element {
  const { collections } = useCollections()
  const defalutValues = [...Object.keys(collections), 'all']
  return (
    <ScrollArea className={cn('w-full h-[700px] pr-3 -mr-3', '3xl:h-[900px]')}>
      {defalutValues.length > 1 && (
        <Accordion
          type="multiple"
          defaultValue={defalutValues}
          className={cn('w-full text-xs flex flex-col gap-2 ')}
        >
          {Object.entries(collections).map(([key, value]) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2 rounded-none')}>
                <div className={cn('flex flex-row items-center justify-start gap-1')}>
                  <div className={cn('text-xs')}>{value.name}</div>
                  <div className={cn('text-2xs text-foreground/50')}>({value.games.length})</div>
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
                {value.games.map((game) => (
                  <GameNav key={game} gameId={game} groupId={`collection:${key}`} />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
          <AllGame />
        </Accordion>
      )}
    </ScrollArea>
  )
}

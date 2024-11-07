import { cn } from '~/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useGameIndexManager } from '~/hooks'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'

export function Others({ fieldName }: { fieldName: string }): JSX.Element {
  const { getAllValuesInKey, filter } = useGameIndexManager()
  const fields = getAllValuesInKey(fieldName)
  return (
    <ScrollArea className={cn('w-full h-full')}>
      <Accordion type="multiple" className={cn('w-full text-xs flex flex-col gap-2')}>
        <AllGame />
        {fields.map((field) => (
          <AccordionItem key={field} value={'all'}>
            <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
              {field}
            </AccordionTrigger>
            <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
              {filter({ [fieldName]: [field] }).map((game) => (
                <GameNav key={game} gameId={game} groupId={`${fieldName}:${field}`} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  )
}

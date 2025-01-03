import { cn } from '~/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useGameIndexManager } from '~/hooks'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function Others({ fieldName }: { fieldName: string }): JSX.Element {
  const { getAllValuesInKey, filter } = useGameIndexManager()
  const fields = getAllValuesInKey(fieldName)
  const defaultValues = [...fields, 'all', 'recentGames']
  function convertFieldToTitle(field: string): string {
    switch (field) {
      case 'unplayed':
        return '未开始'
      case 'playing':
        return '游玩中'
      case 'finished':
        return '已完成'
      case 'multiple':
        return '多周目'
      case 'shelved':
        return '搁置中'
    }
    return field
  }
  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3')}>
      {defaultValues.length > 2 ? (
        <Accordion
          key={`${fieldName}_yes`}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
          defaultValue={defaultValues}
        >
          <RecentGames />
          {fields.map((field) => (
            <AccordionItem key={field} value={field}>
              <AccordionTrigger defaultChecked className={cn('bg-accent/30 text-xs p-1 pl-2')}>
                <div className={cn('flex flex-row items-center justify-start gap-1')}>
                  <div className={cn('text-xs')}>{convertFieldToTitle(field)}</div>
                  <div className={cn('text-2xs text-foreground/50')}>
                    ({filter({ [fieldName]: [field] }).length})
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
                {filter({ [fieldName]: [field] }).map((game) => (
                  <GameNav key={game} gameId={game} groupId={`${fieldName}:${field}`} />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
          <AllGame />
        </Accordion>
      ) : (
        <Accordion
          key={`${fieldName}_no`}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
          defaultValue={defaultValues}
        >
          <RecentGames />
          <AllGame />
        </Accordion>
      )}
    </ScrollArea>
  )
}

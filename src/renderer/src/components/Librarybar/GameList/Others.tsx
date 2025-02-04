import { cn } from '~/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { ContextMenuContent, ContextMenuTrigger, ContextMenu } from '@ui/context-menu'
import { Button } from '@ui/button'
import { useGameIndexManager, useDBSyncedState } from '~/hooks'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function Others({ fieldName }: { fieldName: string }): JSX.Element {
  const { getAllValuesInKey, filter } = useGameIndexManager()
  const [playingStatusOrder, setPlayingStatusOrder] = useDBSyncedState(
    ['unplayed', 'playing', 'finished', 'multiple', 'shelved'],
    `config.json`,
    ['others', 'gameList', 'playingStatusOrder']
  )

  const fields_tmp = getAllValuesInKey(fieldName)
  const fields =
    fieldName === 'playStatus'
      ? playingStatusOrder.filter((item) => fields_tmp.includes(item))
      : fields_tmp

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

  const handleMoveUp = (index: number): void => {
    if (index === 0) return
    const newOrder: string[] = [...fields]
    const nonFieldsItems = playingStatusOrder.filter((item) => !fields.includes(item))
    ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    setPlayingStatusOrder([...newOrder, ...nonFieldsItems])
  }

  const handleMoveDown = (index: number): void => {
    if (index === fields.length - 1) return
    const newOrder: string[] = [...fields]
    const nonFieldsItems = playingStatusOrder.filter((item) => !fields.includes(item))
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setPlayingStatusOrder([...newOrder, ...nonFieldsItems])
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
          {fields.map((field, index) => (
            <AccordionItem key={field} value={field}>
              {fieldName === 'playStatus' ? (
                <ContextMenu>
                  <ContextMenuTrigger className={cn('rounded-none')}>
                    <AccordionTrigger
                      defaultChecked
                      className={cn('bg-accent/30 text-xs p-1 pl-2')}
                    >
                      <div className={cn('flex flex-row items-center justify-start gap-1')}>
                        <div className={cn('text-xs')}>{convertFieldToTitle(field)}</div>
                        <div className={cn('text-2xs text-foreground/50')}>
                          ({filter({ [fieldName]: [field] }).length})
                        </div>
                      </div>
                    </AccordionTrigger>
                  </ContextMenuTrigger>
                  <ContextMenuContent className={cn('w-full p-3')}>
                    <div className={cn('flex flex-row gap-5 items-center justify-center')}>
                      <div className={cn('text-sm whitespace-nowrap')}>调整顺序：</div>
                      <Button
                        variant={'outline'}
                        size={'icon'}
                        className={cn('h-[26px] w-[26px] -ml-3')}
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <span className={cn('icon-[mdi--arrow-up] w-4 h-4')}></span>
                      </Button>
                      <Button
                        variant={'outline'}
                        size={'icon'}
                        className={cn('h-[26px] w-[26px] -ml-3')}
                        onClick={() => handleMoveDown(index)}
                        disabled={index === fields.length - 1}
                      >
                        <span className={cn('icon-[mdi--arrow-down] w-4 h-4')}></span>
                      </Button>
                    </div>
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                <AccordionTrigger defaultChecked className={cn('bg-accent/30 text-xs p-1 pl-2')}>
                  <div className={cn('flex flex-row items-center justify-start gap-1')}>
                    <div className={cn('text-xs')}>{convertFieldToTitle(field)}</div>
                    <div className={cn('text-2xs text-foreground/50')}>
                      ({filter({ [fieldName]: [field] }).length})
                    </div>
                  </div>
                </AccordionTrigger>
              )}
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

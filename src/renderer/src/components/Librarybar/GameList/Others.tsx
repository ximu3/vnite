import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { filterGames, getAllValuesInKey, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function Others({
  fieldName
}: {
  fieldName: 'metadata.developers' | 'metadata.genres' | 'record.playStatus'
}): JSX.Element {
  const [playStatusOrder, _setPlayStatusOrder] = useConfigState('game.gameList.playingStatusOrder')
  const [by, _setBy] = useConfigState('game.gameList.sort.by')
  const [order, _setOrder] = useConfigState('game.gameList.sort.order')

  const fields_tmp = getAllValuesInKey(fieldName)
  const fields =
    fieldName === 'record.playStatus'
      ? playStatusOrder.filter((item) => fields_tmp.includes(item))
      : fields_tmp

  const defaultValues = [...fields, 'all', 'recentGames']
  const { t } = useTranslation('game')
  function convertFieldToTitle(field: string): string {
    switch (field) {
      case 'unplayed':
        return t('utils:game.playStatus.unplayed')
      case 'playing':
        return t('utils:game.playStatus.playing')
      case 'finished':
        return t('utils:game.playStatus.finished')
      case 'multiple':
        return t('utils:game.playStatus.multiple')
      case 'shelved':
        return t('utils:game.playStatus.shelved')
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
                    ({filterGames({ [fieldName]: [field] }).length})
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
                {sortGames(by, order, filterGames({ [fieldName]: [field] })).map((game) => (
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

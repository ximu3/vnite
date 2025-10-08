import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useConfigState } from '~/hooks'
import { filterGames, getAllValuesInKey, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { useGameListStore } from '../store'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function Others({
  fieldName
}: {
  fieldName: 'metadata.developers' | 'metadata.genres'
}): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const [showAllGamesInGroup] = useConfigState('game.gameList.showAllGamesInGroup')

  const fields = getAllValuesInKey(fieldName)
  const defaultValues = [...fields, 'all', 'recentGames']

  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const openValues = useGameListStore((s) => s.getOpenValues(fieldName))
  const handleAccordionChange = (v: string[]): void => {
    const valid = v.filter((key) => defaultValues.includes(key)) // Remove the zombie key in storge
    setOpenValues(fieldName, valid)
  }

  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3 pb-1 pt-1')}>
      {defaultValues.length > 2 ? (
        <Accordion
          key={`${fieldName}`}
          value={openValues}
          onValueChange={handleAccordionChange}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
        >
          {/* Recent Games */}
          <RecentGames />
          {/* Split games into their respective fields */}
          {fields.map((field) => (
            <AccordionItem key={field} value={field}>
              <AccordionTrigger defaultChecked className={cn('text-xs p-1 pl-2')}>
                <div className={cn('flex flex-row items-center justify-start gap-1')}>
                  <div className={cn('text-xs')}>{field}</div>
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
          {/* All Games */}
          {showAllGamesInGroup && <AllGame />}
        </Accordion>
      ) : (
        <Accordion
          key={`${fieldName}_no`}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
          value={openValues}
          onValueChange={handleAccordionChange}
        >
          <RecentGames />
          <AllGame />
        </Accordion>
      )}
    </ScrollArea>
  )
}

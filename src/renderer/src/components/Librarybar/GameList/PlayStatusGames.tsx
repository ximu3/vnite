import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useConfigState } from '~/hooks'
import { filterGames, filterGamesByNSFW, getAllValuesInKey, sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { useGameListStore } from '../store'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function PlayStatusGames(): React.JSX.Element {
  const [playStatusOrder, _setPlayStatusOrder] = useConfigState('game.gameList.playingStatusOrder')
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const [showAllGamesInGroup] = useConfigState('game.gameList.showAllGamesInGroup')
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')

  const fields_tmp = getAllValuesInKey('record.playStatus')
  const fields = playStatusOrder.filter((item) => fields_tmp.includes(item))

  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const openValues = useGameListStore((s) => s.getOpenValues('record.playStatus'))
  const handleAccordionChange = (v: string[]): void => {
    setOpenValues('record.playStatus', v)
  }

  const { t } = useTranslation('game')
  function convertFieldToTitle(field: string): string {
    switch (field) {
      case 'unplayed':
        return t('utils:game.playStatus.unplayed')
      case 'playing':
        return t('utils:game.playStatus.playing')
      case 'partial':
        return t('utils:game.playStatus.partial')
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
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3 pt-1 pb-1')}>
      {fields.length > 0 ? (
        <Accordion
          key={`record.playStatus`}
          value={openValues}
          onValueChange={handleAccordionChange}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
        >
          {/* Recent Games */}
          <RecentGames />
          {/* Split games into their respective play status */}
          {fields.map((field) => {
            const gameIds = filterGamesByNSFW(
              nsfwFilterMode,
              filterGames({ ['record.playStatus']: [field] })
            )
            if (gameIds.length === 0) return <></>

            return (
              <AccordionItem key={field} value={field}>
                <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
                  <div className={cn('flex flex-row items-center justify-start gap-1')}>
                    <div className={cn('text-xs')}>{convertFieldToTitle(field)}</div>
                    <div className={cn('text-2xs text-foreground/50')}>({gameIds.length})</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
                  {sortGames(by, order, gameIds).map((game) => (
                    <GameNav key={game} gameId={game} groupId={`record.playStatus:${field}`} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            )
          })}
          {/* All Games */}
          {showAllGamesInGroup && <AllGame />}
        </Accordion>
      ) : (
        <Accordion
          key={`record.playStatus_no`}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
          defaultValue={['all', 'recentGames']}
        >
          <RecentGames />
          <AllGame />
        </Accordion>
      )}
    </ScrollArea>
  )
}

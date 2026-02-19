import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useConfigState } from '~/hooks'
import {
  filterGames,
  filterGamesByLocal,
  filterGamesByNSFW,
  getAllValuesInKey,
  sortGames
} from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { useGameListStore, usePlayStatusOrderStore } from '../store'
import { AllGameComponent } from './AllGame'
import { PlaceHolder } from './PlaceHolder'
import { RecentGames } from './RecentGames'

export function PlayStatusGamesComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const [showAllGamesInGroup] = useConfigState('game.gameList.showAllGamesInGroup')
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const [localFilterMode] = useConfigState('appearances.localGameFilterMode')
  const playStatusOrder = usePlayStatusOrderStore((s) => s.playStatusOrder)

  const fields_tmp = getAllValuesInKey('record.playStatus')
  const fields = playStatusOrder.filter((item) => fields_tmp.includes(item))

  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const openValues = useGameListStore((s) => s.getOpenValues('record.playStatus'))
  const handleAccordionChange = (v: string[]): void => {
    setOpenValues('record.playStatus', v)
  }

  const { t } = useTranslation('game')

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
            const gameIds = filterGamesByLocal(
              localFilterMode,
              filterGamesByNSFW(nsfwFilterMode, filterGames({ ['record.playStatus']: [field] }))
            )
            if (gameIds.length === 0) return <></>

            return (
              <AccordionItem key={field} value={field}>
                <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
                  <div className={cn('flex flex-row items-center justify-start gap-1')}>
                    <div className={cn('text-xs')}>{t(`utils:game.playStatus.${field}`)}</div>
                    <div className={cn('text-2xs text-foreground/50')}>({gameIds.length})</div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
                  {sortGames(by, order, gameIds).map((game) => (
                    <LazyLoadComponent
                      key={game}
                      threshold={300}
                      scrollPosition={scrollPosition}
                      placeholder={
                        <PlaceHolder gameId={game} groupId={`record.playStatus:${field}`} />
                      }
                    >
                      <GameNav key={game} gameId={game} groupId={`record.playStatus:${field}`} />
                    </LazyLoadComponent>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )
          })}
          {/* All Games */}
          {showAllGamesInGroup && <AllGameComponent scrollPosition={scrollPosition} />}
        </Accordion>
      ) : (
        <Accordion
          key={`record.playStatus_no`}
          type="multiple"
          className={cn('w-full text-xs flex flex-col gap-2')}
          defaultValue={['all', 'recentGames']}
        >
          <RecentGames />
          <AllGameComponent scrollPosition={scrollPosition} />
        </Accordion>
      )}
    </ScrollArea>
  )
}

export const PlayStatusGames = trackWindowScroll(PlayStatusGamesComponent)

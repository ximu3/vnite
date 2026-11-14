import { useTranslation } from 'react-i18next'
import { GameSelectionProvider } from '~/components/GameBatchEditor/GameSelectionProvider'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import { useConfigState } from '~/hooks'
import { sortGames, useVisibleGameIds } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { GroupSortSummary } from './GroupSortSummary'
import { PlaceHolder } from './PlaceHolder'

export function AllGameComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): React.JSX.Element {
  const [sort] = useConfigState('game.gameList.sort')
  const visibleGameIds = useVisibleGameIds()
  const games = sortGames(sort, visibleGameIds)
  const { t } = useTranslation('game')

  return (
    <AccordionItem value="all">
      <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
        <div className={cn('flex flex-row items-center justify-start gap-1')}>
          <div className={cn('text-xs')}>{t('list.all.title')}</div>
          <GroupSortSummary gameIds={games} sort={sort} />
        </div>
      </AccordionTrigger>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        <GameSelectionProvider scopeId="sidebar:all" orderedGameIds={games}>
          {games.map((gameId) => (
            <LazyLoadComponent
              key={gameId}
              threshold={300}
              scrollPosition={scrollPosition}
              placeholder={<PlaceHolder gameId={gameId} groupId="all" />}
            >
              <GameNav gameId={gameId} groupId="all" />
            </LazyLoadComponent>
          ))}
        </GameSelectionProvider>
      </AccordionContent>
    </AccordionItem>
  )
}

export const AllGame = trackWindowScroll(AllGameComponent)

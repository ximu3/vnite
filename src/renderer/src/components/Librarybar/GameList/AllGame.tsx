import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { useConfigState } from '~/hooks'
import { sortGames } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'

function PlaceHolder({ gameId }: { gameId: string }): JSX.Element {
  return (
    <div
      className={cn('p-3 h-5 rounded-none bg-transparent')}
      data-game-id={gameId}
      data-group-id={'all'}
    ></div>
  )
}

export function AllGameComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): JSX.Element {
  const [by, _setBy] = useConfigState('game.gameList.sort.by')
  const [order, _setOrder] = useConfigState('game.gameList.sort.order')
  const games = sortGames(by, order)
  const { t } = useTranslation('game')

  return (
    <AccordionItem value="all">
      <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
        <div className={cn('flex flex-row items-center justify-start gap-1')}>
          <div className={cn('text-xs')}>{t('list.all.title')}</div>
          <div className={cn('text-2xs text-foreground/50')}>({games.length})</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        {games.map((gameId) => (
          <LazyLoadComponent
            key={gameId}
            threshold={300}
            scrollPosition={scrollPosition}
            placeholder={<PlaceHolder gameId={gameId} />}
          >
            <GameNav gameId={gameId} groupId="all" />
          </LazyLoadComponent>
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

export const AllGame = trackWindowScroll(AllGameComponent)

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useConfigState } from '~/hooks'
import { useGameCollectionStore } from '~/stores'
import { filterGamesByNSFW, sortGames, useGameRegistry } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { useGameListStore } from '../store'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function Collection(): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const [overrideCollectionSort] = useConfigState('game.gameList.overrideCollectionSort')
  const collections = useGameCollectionStore((state) => state.documents)
  const gameIds = useGameRegistry((s) => s.gameIds)
  const defaultValues = [...Object.keys(collections), '__empty__', 'all', 'recentGames']
  const [showAllGamesInGroup] = useConfigState('game.gameList.showAllGamesInGroup')
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')

  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const openValues = useGameListStore((s) => s.getOpenValues('collection'))
  const handleAccordionChange = (v: string[]): void => {
    const valid = v.filter((key) => defaultValues.includes(key)) // Remove the zombie key in storge
    setOpenValues('collection', valid)
  }
  const { t } = useTranslation('game')

  // Sort collections by the sort field
  const sortedCollections = useMemo(() => {
    return Object.entries(collections).sort(([, a], [, b]) => a.sort - b.sort)
  }, [collections])

  const collectedGameIds = useMemo(
    () => new Set(Object.values(collections).flatMap((c) => c.games)),
    [collections]
  )

  const uncollectedGameIds = useMemo(
    () => gameIds.filter((id) => !collectedGameIds.has(id)),
    [gameIds, collectedGameIds]
  )

  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3 pt-1 pb-1')}>
      {defaultValues.length > 2 ? (
        <Accordion
          key={'collection'}
          type="multiple"
          value={openValues}
          onValueChange={handleAccordionChange}
          className={cn('min-w-0 text-xs flex flex-col gap-2')}
        >
          {/* Recent Games */}
          <RecentGames />
          {/* Split games into their respective collections */}
          {sortedCollections.map(([key, value]) => {
            const gameIds = filterGamesByNSFW(nsfwFilterMode, value.games)
            if (gameIds.length === 0) return <></>

            return (
              <AccordionItem key={key} value={key}>
                <CollectionCM collectionId={key}>
                  <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
                    <div className={cn('flex flex-row items-center justify-start gap-1')}>
                      <div className={cn('text-xs')}>{value.name}</div>
                      <div className={cn('text-2xs text-foreground/50')}>({gameIds.length})</div>
                    </div>
                  </AccordionTrigger>
                </CollectionCM>
                <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1 w-full')}>
                  {(overrideCollectionSort ? sortGames(by, order, gameIds) : gameIds).map(
                    (game) => (
                      <GameNav key={game} gameId={game} groupId={`collection:${key}`} />
                    )
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
          {uncollectedGameIds.length > 0 && (
            <AccordionItem key={'__empty__'} value={'__empty__'}>
              <AccordionTrigger className={cn('text-xs p-1 pl-2')}>
                <div className={cn('flex flex-row items-center justify-start gap-1')}>
                  <div className={cn('text-xs')}>{t('list.empty.collection')}</div>
                  <div className={cn('text-2xs text-foreground/50')}>
                    ({uncollectedGameIds.length})
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1 w-full')}>
                {sortGames(by, order, uncollectedGameIds).map((game) => (
                  <GameNav key={game} gameId={game} groupId={'all'} />
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
          {/* All Games */}
          {showAllGamesInGroup && <AllGame />}
        </Accordion>
      ) : (
        <Accordion
          key={'collection-no'}
          type="multiple"
          value={openValues}
          onValueChange={handleAccordionChange}
          className={cn('w-full text-xs flex flex-col gap-2 ')}
        >
          <RecentGames />
          <AllGame />
        </Accordion>
      )}
    </ScrollArea>
  )
}

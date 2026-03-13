import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LazyLoadComponent, trackWindowScroll } from 'react-lazy-load-image-component'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import { useConfigState } from '~/hooks'
import { useGameCollectionStore } from '~/stores'
import { filterGamesByLocal, filterGamesByNSFW, sortGames, useGameRegistry } from '~/stores/game'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { useGameListStore } from '../store'
import { AllGameComponent } from './AllGame'
import { PlaceHolder } from './PlaceHolder'
import { RecentGames } from './RecentGames'

export function CollectionComponent({
  scrollPosition
}: {
  scrollPosition: { x: number; y: number }
}): React.JSX.Element {
  const [by] = useConfigState('game.gameList.sort.by')
  const [order] = useConfigState('game.gameList.sort.order')
  const [overrideCollectionSort] = useConfigState('game.gameList.overrideCollectionSort')
  const collections = useGameCollectionStore((state) => state.documents)
  const gameIds = useGameRegistry((s) => s.gameIds)
  const defaultValues = [...Object.keys(collections), '__empty__', 'all', 'recentGames']
  const [showAllGamesInGroup] = useConfigState('game.gameList.showAllGamesInGroup')
  const [nsfwFilterMode] = useConfigState('appearances.nsfwFilterMode')
  const [localFilterMode] = useConfigState('appearances.localGameFilterMode')

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

  const uncollectedGameIds = useMemo(() => {
    const uncollected = gameIds.filter((id) => !collectedGameIds.has(id))
    return filterGamesByLocal(localFilterMode, filterGamesByNSFW(nsfwFilterMode, uncollected))
  }, [gameIds, collectedGameIds, nsfwFilterMode, localFilterMode])

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
            const gameIds = filterGamesByLocal(
              localFilterMode,
              filterGamesByNSFW(nsfwFilterMode, value.games)
            )
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
                      <LazyLoadComponent
                        key={game}
                        threshold={300}
                        scrollPosition={scrollPosition}
                        placeholder={<PlaceHolder gameId={game} groupId={`collection:${key}`} />}
                      >
                        <GameNav key={game} gameId={game} groupId={`collection:${key}`} />
                      </LazyLoadComponent>
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
                  <LazyLoadComponent
                    key={game}
                    threshold={300}
                    scrollPosition={scrollPosition}
                    placeholder={<PlaceHolder gameId={game} groupId={'all'} />}
                  >
                    <GameNav key={game} gameId={game} groupId={'all'} />
                  </LazyLoadComponent>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
          {/* All Games */}
          {showAllGamesInGroup && <AllGameComponent scrollPosition={scrollPosition} />}
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
          <AllGameComponent scrollPosition={scrollPosition} />
        </Accordion>
      )}
    </ScrollArea>
  )
}

export const Collection = trackWindowScroll(CollectionComponent)

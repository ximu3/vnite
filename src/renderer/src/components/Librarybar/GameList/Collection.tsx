import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { ScrollArea } from '@ui/scroll-area'
import { useMemo } from 'react'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'
import { GameNav } from '../GameNav'
import { AllGame } from './AllGame'
import { RecentGames } from './RecentGames'

export function Collection(): JSX.Element {
  const collections = useGameCollectionStore((state) => state.documents)
  const defaultValues = [...Object.keys(collections), 'all', 'recentGames']

  // Sort collections by the sort field
  const sortedCollections = useMemo(() => {
    return Object.entries(collections).sort(([, a], [, b]) => a.sort - b.sort)
  }, [collections])

  return (
    <ScrollArea className={cn('w-full h-full pr-3 -mr-3')}>
      {defaultValues.length > 2 ? (
        <Accordion
          key={'collection-yes'}
          type="multiple"
          defaultValue={defaultValues}
          className={cn('w-full text-xs flex flex-col gap-2')}
        >
          <RecentGames />
          {sortedCollections.map(([key, value]) => (
            <AccordionItem key={key} value={key}>
              <CollectionCM collectionId={key}>
                <AccordionTrigger className={cn('text-xs p-1 pl-2 bg-accent/35')}>
                  <div className={cn('flex flex-row items-center justify-start gap-1')}>
                    <div className={cn('text-xs')}>{value.name}</div>
                    <div className={cn('text-2xs text-foreground/50')}>({value.games.length})</div>
                  </div>
                </AccordionTrigger>
              </CollectionCM>
              <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
                {value.games.map((game) => (
                  <GameNav key={game} gameId={game} groupId={`collection:${key}`} />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}

          <AllGame />
        </Accordion>
      ) : (
        <Accordion
          key={'collection-no'}
          type="multiple"
          defaultValue={defaultValues}
          className={cn('w-full text-xs flex flex-col gap-2 ')}
        >
          <RecentGames />
          <AllGame />
        </Accordion>
      )}
    </ScrollArea>
  )
}

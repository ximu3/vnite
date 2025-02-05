import { cn } from '~/utils'
import { Separator } from '@ui/separator'
import { ScrollArea } from '@ui/scroll-area'
import { useCollections } from '~/hooks'
import { GamePoster } from './posters/GamePoster'

export function CollectionGames({ collectionId }: { collectionId: string }): JSX.Element {
  const { collections } = useCollections()
  const games = collections[collectionId].games
  const collectionName = collections[collectionId].name

  return (
    <div className={cn('flex flex-col gap-3 h-[100vh] pt-[30px]')}>
      <ScrollArea className={cn('w-full')}>
        <div className={cn('w-full flex flex-col gap-1 pt-3')}>
          <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
            <div className={cn('text-accent-foreground flex-shrink-0')}>{collectionName}</div>

            {/* Split Line Container */}
            <div className={cn('flex items-center justify-center flex-grow pr-5')}>
              <Separator className={cn('flex-grow')} />
            </div>
          </div>

          {/* Game List Container */}
          <div
            className={cn(
              'flex flex-row gap-6 grow flex-wrap',
              'w-full',
              'pt-2 pb-6 pl-5' // Add inner margins to show shadows
            )}
          >
            {/* The wrapper ensures that each Poster maintains a fixed width */}
            {games.map((gameId) => (
              <div
                key={gameId}
                className={cn(
                  'flex-shrink-0' // Preventing compression
                )}
              >
                <GamePoster gameId={gameId} groupId={`collection:${collectionId}`} />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

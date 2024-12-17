import { HoverSquareCardAnimation } from '~/components/animations/HoverSquareCard'
import { cn } from '~/utils'
import { useNavigate } from 'react-router-dom'
import { useCollections } from '~/hooks'
import { CollectionCM } from '~/components/contextMenu/CollectionCM'
import { GameImage } from '@ui/game-image'

export function CollectionPoster({
  collectionId,
  className
}: {
  collectionId: string
  className?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { collections } = useCollections()
  const collectionName = collections[collectionId].name
  const gameId = collections[collectionId].games[0]
  const length = collections[collectionId].games.length
  return (
    <CollectionCM collectionId={collectionId}>
      <div
        className={cn(
          'group relative overflow-hidden shadow-custom-initial cursor-pointer w-[160px] h-[160px] rounded-[0.3rem]',
          'transition-border duration-300 ease-in-out',
          'border-2 border-transparent',
          'hover:border-primary hover:border-2',
          '3xl:w-[190px] 3xl:h-[190px]'
        )}
        onClick={() => navigate(`/library/collections/${collectionId}`)}
      >
        {/* background mask layer */}
        <div
          className={cn(
            'absolute inset-0 bg-muted/40 backdrop-blur-sm z-10 border-t-0.5 border-white/30 pointer-events-none'
          )}
        />

        {/* HoverBigCardAnimation layer */}

        <div className="relative z-0">
          <HoverSquareCardAnimation className={cn('rounded-none')}>
            <GameImage
              gameId={gameId}
              type="cover"
              alt={gameId}
              className={cn(
                'w-full h-full cursor-pointer object-cover',
                '3xl:w-full 3xl:h-full',
                className
              )}
              fallback={
                <div
                  className={cn(
                    'w-full h-full cursor-pointer object-cover flex items-center justify-center',
                    '3xl:w-full 3xl:h-full',
                    className
                  )}
                ></div>
              }
            />
          </HoverSquareCardAnimation>
        </div>

        {/* text content layer */}
        <div
          className={cn(
            'absolute inset-0 z-20 mt-7',
            'flex items-center justify-center',
            'pointer-events-none'
          )}
        >
          <div className="flex flex-col gap-1 items-center justify-center">
            <div className={cn('text-accent-foreground text-lg font-semibold')}>
              {collectionName}
            </div>
            <div className={cn('text-accent-foreground/70')}>{`( ${length} )`}</div>
          </div>
        </div>
      </div>
    </CollectionCM>
  )
}

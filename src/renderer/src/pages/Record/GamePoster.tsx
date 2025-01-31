import { HoverSquareCardAnimation } from '~/components/animations/HoverSquareCard'
import { cn } from '~/utils'
import { useNavigate } from 'react-router-dom'
import { useDBSyncedState } from '~/hooks'
import { GameImage } from '~/components/ui/game-image'

export function GamePoster({
  gameId,
  className,
  isShowGameName = false,
  additionalInfo,
  infoStyle,
  fontStyles
}: {
  gameId: string
  className?: string
  isShowGameName?: boolean
  additionalInfo?: string
  infoStyle?: string
  fontStyles?: { name: string; additionalInfo: string }
}): JSX.Element {
  const navigate = useNavigate()
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  return (
    <div
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-lg',
        'transition-border duration-300 ease-in-out',
        'border-2 border-transparent',
        'hover:border-primary hover:border-2',
        className
      )}
      onClick={() => navigate(`/library/games/${gameId}/all`)}
    >
      {/* Add a background mask layer */}
      {isShowGameName && (
        <div
          className={cn(
            'absolute inset-0 bg-muted/40 backdrop-blur-md z-10 border-t-0.5 border-white/30 pointer-events-none'
          )}
        />
      )}

      {/* HoverBigCardAnimation layer */}

      <div className="relative z-0">
        <HoverSquareCardAnimation className={cn('rounded-none shadow-none')}>
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
      {isShowGameName && (
        <div
          className={cn(
            'absolute inset-0 z-20',
            'flex flex-col gap-1 items-center justify-center',
            'pointer-events-none',
            infoStyle
          )}
        >
          <div
            className={cn('text-accent-foreground text-xl font-bold truncate', fontStyles?.name)}
          >
            {gameName}
          </div>
          <div className={cn('text-accent-foreground/80 text-lg', fontStyles?.additionalInfo)}>
            {additionalInfo}
          </div>
        </div>
      )}
    </div>
  )
}

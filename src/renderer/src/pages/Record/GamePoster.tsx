import { generateUUID } from '@appUtils'
import { useRouter } from '@tanstack/react-router'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'
import { GameImage } from '~/components/ui/game-image'
import { useGameState } from '~/hooks'
import { cn, scrollToElement } from '~/utils'

export function GamePoster({
  gameId,
  className,
  isShowGameName = false,
  blur = false,
  additionalInfo,
  infoStyle,
  fontStyles
}: {
  gameId: string
  className?: string
  isShowGameName?: boolean
  blur?: boolean
  additionalInfo?: string
  infoStyle?: string
  fontStyles?: { name: string; additionalInfo: string }
}): React.JSX.Element {
  const router = useRouter()
  const [gameName] = useGameState(gameId, 'metadata.name')
  const setLazyloadMark = usePositionButtonStore((state) => state.setLazyloadMark)
  return (
    <div
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-lg',
        'transition-all duration-300 ease-in-out',
        'hover:ring-primary hover:ring-2',
        className
      )}
      onClick={() => {
        router.navigate({ to: `/library/games/${gameId}/all` })
        setTimeout(() => {
          scrollToElement({
            selector: `[data-game-id="${gameId}"][data-group-id="all"]`
          })
          setTimeout(() => {
            setLazyloadMark(generateUUID())
          }, 100)
        }, 50)
      }}
    >
      {/* Add a background mask layer */}
      {isShowGameName && (
        <div
          className={cn(
            'absolute inset-0 bg-muted/40 backdrop-blur-md z-10 border-t-0.5 border-white/30 pointer-events-none'
          )}
        />
      )}

      <div className="relative z-0">
        <HoverCardAnimation className={cn('rounded-none shadow-none')}>
          <GameImage
            gameId={gameId}
            type="cover"
            alt={gameId}
            blur={blur}
            className={cn('w-full h-full cursor-pointer object-cover', className)}
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
        </HoverCardAnimation>
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

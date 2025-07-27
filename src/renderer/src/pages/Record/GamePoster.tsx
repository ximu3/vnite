import { generateUUID } from '@appUtils'
import { useRouter } from '@tanstack/react-router'
import { HoverCardAnimation } from '~/components/animations/HoverCard'
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'
import { GameImage } from '~/components/ui/game-image'
import { cn, scrollToElement } from '~/utils'

export function GamePoster({
  gameId,
  className,
  blur = false
}: {
  gameId: string
  className?: string
  blur?: boolean
}): React.JSX.Element {
  const router = useRouter()
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
    </div>
  )
}

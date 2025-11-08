import { useNavigate } from '@tanstack/react-router'
import { VariantProps } from 'class-variance-authority'
import { Button, buttonVariants } from '~/components/ui/button'
import { cn, navigateToGame, startGame, stopGame } from '~/utils'

type PlayButtonType = 'play' | 'stop'
type PlayButtonConfig = {
  variant: VariantProps<typeof buttonVariants>['variant']
  buttonClassName: string
  iconClassName: string
}

const PLAY_BUTTON_CONFIGS: Record<PlayButtonType, PlayButtonConfig> = {
  play: {
    variant: 'default',
    buttonClassName: 'bg-primary hover:bg-primary/60',
    iconClassName: 'icon-[mdi--play] text-primary-foreground'
  },
  stop: {
    variant: 'secondary',
    buttonClassName: 'bg-secondary hover:bg-secondary/60',
    iconClassName: 'icon-[mdi--stop] text-secondary-foreground'
  }
}

export function PlayButton({
  gameId,
  groupId,
  type
}: {
  gameId: string
  groupId?: string
  type: PlayButtonType
}): React.JSX.Element {
  const config = PLAY_BUTTON_CONFIGS[type]
  const navigate = useNavigate()

  const getHandler = (type: PlayButtonType) => {
    switch (type) {
      case 'play':
        return (e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          navigateToGame(navigate, gameId, groupId || 'all')
          startGame(gameId)
        }
      case 'stop':
        return (e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          stopGame(gameId)
        }
    }
  }

  return (
    <div className="relative w-[46px] h-[46px]">
      <Button
        variant={config.variant}
        className={cn(
          'rounded-full w-full h-full p-0',
          'peer transition-transform duration-200 ease-in-out hover:scale-150',
          config.buttonClassName
        )}
        onClick={getHandler(type)}
      />
      <span
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-7 h-7 pointer-events-none',
          'transition-transform duration-200 ease-in-out peer-hover:scale-95',
          config.iconClassName
        )}
      />
    </div>
  )
}

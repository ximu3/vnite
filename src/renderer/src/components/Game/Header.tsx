import { GameImage } from '../ui/game-image'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { cn, copyWithToast } from '~/utils'
import { Config } from './Config'
import { Record } from './Overview/Record'
import { StartGame } from './StartGame'
import { StopGame } from './StopGame'

export function Header({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const runningGames = useRunningGames((state) => state.runningGames)
  const [name] = useGameState(gameId, 'metadata.name')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [showOriginalNameInGameHeader] = useConfigState('game.gameHeader.showOriginalName')
  const [enableNSFWBlur] = useConfigState('appearances.enableNSFWBlur')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')

  return (
    <div className={cn('flex-col flex gap-5 px-7 py-5 pl-6 pt-6 relative', className)}>
      {/* Game name section */}
      <div className="flex flex-row justify-between items-end">
        <div
          className={cn('flex flex-col gap-3 grow overflow-hidden items-start justify-start pl-1')}
        >
          <div
            className={cn(
              'font-bold text-2xl text-accent-foreground cursor-pointer select-none text-shadow-lg'
            )}
            onClick={() => copyWithToast(name)}
          >
            {name}
          </div>
          {showOriginalNameInGameHeader && originalName && (
            <div
              className={cn('font-bold text-accent-foreground cursor-pointer select-none')}
              onClick={() => copyWithToast(originalName)}
            >
              {originalName}
            </div>
          )}
          <div
            className={cn(
              'flex flex-row justify-between items-end duration-300 select-none mt-2 pb-1',
              '3xl:gap-5'
            )}
          >
            {/* Game records and action buttons */}

            <div className={cn('flex flex-row gap-3 items-end z-20', '3xl:gap-5')}>
              {/* Start/Stop game button */}
              {runningGames.includes(gameId) ? (
                <StopGame gameId={gameId} className={cn('w-[170px] h-[40px]')} />
              ) : (
                <StartGame gameId={gameId} className={cn('w-[170px] h-[40px]')} />
              )}

              {/* Configuration button */}
              <Config gameId={gameId} />
            </div>
          </div>
        </div>
        <div className="relative lg:mr-3 pb-1 shrink-0">
          <GameImage
            gameId={gameId}
            key={`${gameId}-poster`}
            type="cover"
            blur={enableNSFWBlur && nsfw}
            className={cn('w-auto h-[170px] object-cover rounded-lg shadow-md')}
            fallback={<div className="h-[170px]" />}
          />
          {/* <div className="absolute inset-0 rounded-lg bg-background/15" /> */}
        </div>
      </div>
      <div className="pt-6">
        <Record gameId={gameId} />
      </div>
    </div>
  )
}

import { cn } from '~/utils'
import { GamePoster } from './GamePoster'
import { useGameState } from '~/hooks'

interface GameRankingItemProps {
  gameId: string
  rank: number
  extraInfo: string
  className?: string
}

export function GameRankingItem({
  gameId,
  rank,
  extraInfo,
  className
}: GameRankingItemProps): JSX.Element {
  const [gameName] = useGameState(gameId, 'metadata.name')

  return (
    <div className={cn('flex items-center space-x-4 py-2', className)}>
      <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold rounded-full bg-primary text-primary-foreground">
        {rank}
      </div>
      <GamePoster gameId={gameId} className="flex-shrink-0 w-10 h-10 rounded-md" />
      <div className="flex-grow min-w-0">
        <p className="text-sm font-medium truncate">{gameName}</p>
      </div>
      <div className="flex-shrink-0 text-sm text-muted-foreground">{extraInfo}</div>
    </div>
  )
}

import { cn } from '~/utils'
import { Description } from './description'
import { ExtraInformation } from './extraInformation'
import { Information } from './Information'
import { RelatedGamesCard } from './RelatedGames'
import { RelatedSites } from './RelatedSites'
import { Tags } from './Tags'

export function Overview({ gameId }: { gameId: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        'w-full h-full grid gap-5 pt-2 bg-transparent',
        'grid-cols-1 lg:grid-cols-4' // Single column on small screens, 4 columns on large screens
      )}
    >
      {/* Left/Top area - 3 columns on large screens, full width on small screens */}
      <div className={cn('flex flex-col gap-5 h-full', 'col-span-1 lg:col-span-3')}>
        <Description gameId={gameId} />
        <Tags gameId={gameId} />
      </div>

      {/* Right/Bottom area - 1 column on large screens, full width on small screens */}
      <div className={cn('flex flex-col gap-5', 'col-span-1')}>
        <Information gameId={gameId} />
        <ExtraInformation gameId={gameId} />
        <RelatedGamesCard gameId={gameId} />
        <RelatedSites gameId={gameId} />
      </div>
    </div>
  )
}

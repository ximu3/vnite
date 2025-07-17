import { Description } from './description'
import { Tags } from './Tags'
import { Information } from './Information'
import { RelatedSites } from './RelatedSites'
import { ExtraInformation } from './extraInformation'
import { cn } from '~/utils'

export function Overview({ gameId }: { gameId: string }): React.JSX.Element {
  return (
    <div className={cn('w-full h-full flex flex-row gap-5 pt-2 bg-transparent', '3xl:gap-7')}>
      <div className={cn('w-3/4 flex flex-col gap-5 h-full')}>
        <Description gameId={gameId} />
        <Tags gameId={gameId} />
      </div>
      <div className={cn('flex flex-col gap-5 w-1/4')}>
        <Information gameId={gameId} />
        <ExtraInformation gameId={gameId} />
        <RelatedSites gameId={gameId} />
      </div>
    </div>
  )
}

import { Record } from './Record'
import { Description } from './description'
import { Tags } from './Tags'
import { Information } from './Information'
import { RelatedSites } from './RelatedSites'
import { cn } from '~/utils'

export function Overview({ gameId }: { gameId: string }): JSX.Element {
  return (
    <div className={cn('w-full h-full flex flex-col gap-5 pt-2', '3xl:gap-7')}>
      <Record gameId={gameId} />
      <div className={cn('flex flex-row gap-5 items-start justify-start ', '3xl:gap-7')}>
        <div className={cn('w-3/4 flex flex-col gap-5 h-full')}>
          <Description gameId={gameId} className={cn('grow')} />
          <Tags gameId={gameId} />
        </div>
        <div className={cn('flex flex-col gap-5 w-1/4', '3xl:gap-7')}>
          <Information gameId={gameId} />
          <RelatedSites gameId={gameId} />
        </div>
      </div>
    </div>
  )
}

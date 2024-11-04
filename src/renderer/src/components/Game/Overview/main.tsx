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
        <div
          className={cn(
            'w-[calc(75%-4px)] flex flex-col gap-5 shrink-0 h-full',
            '3xl:w-[calc(75%-6px)] 3xl:gap-7'
          )}
        >
          <Description gameId={gameId} className={cn('grow')} />
          <Tags gameId={gameId} />
        </div>
        <div className={cn('flex flex-col gap-5 grow', '3xl:gap-7')}>
          <Information gameId={gameId} />
          <RelatedSites gameId={gameId} />
        </div>
      </div>
    </div>
  )
}

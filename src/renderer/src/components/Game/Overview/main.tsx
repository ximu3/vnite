import { RecordCard } from './RecordCard'
import { Introduction } from './Introduction'
import { Tags } from './Tags'
import { Information } from './Information'
import { RelatedSites } from './RelatedSites'
import { cn } from '~/utils'

export function Overview({ gameId }: { gameId: string }): JSX.Element {
  return (
    <div className={cn('w-full h-full flex flex-col gap-5 pt-2', '3xl:gap-7')}>
      <div className={cn('flex flex-row gap-5', '3xl:gap-7')}>
        <RecordCard
          title="游玩时间"
          content="19.3 h"
          icon="icon-[mdi--timer-outline] w-[20px] h-[20px]"
          className={cn('w-1/4')}
        />
        <RecordCard
          title="最后运行日期"
          content="2024-10-20"
          icon="icon-[mdi--calendar-blank-multiple] w-[18px] h-[18px]"
          className={cn('w-1/4')}
        />
        <RecordCard
          title="状态"
          content="游玩中"
          icon="icon-[mdi--bookmark-outline] w-[20px] h-[20px]"
          className={cn('w-1/4')}
        />
        <RecordCard
          title="我的评分"
          content="8.5 分"
          icon="icon-[mdi--starburst-outline] w-[18px] h-[18px]"
          className={cn('w-1/4')}
        />
      </div>
      <div className={cn('flex flex-row gap-5 items-start justify-start', '3xl:gap-7')}>
        <div
          className={cn('w-[calc(75%-4px)] flex flex-col gap-5', '3xl:w-[calc(75%-6px)] 3xl:gap-7')}
        >
          <Introduction gameId={gameId} />
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

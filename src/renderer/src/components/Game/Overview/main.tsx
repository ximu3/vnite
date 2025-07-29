import { Description } from './description'
import { Tags } from './Tags'
import { Information } from './Information'
import { RelatedSites } from './RelatedSites'
import { ExtraInformation } from './extraInformation'
import { cn } from '~/utils'

export function Overview({ gameId }: { gameId: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        'w-full h-full grid gap-5 pt-2 bg-transparent',
        'grid-cols-1 lg:grid-cols-4' // 小屏幕单列，大屏幕4列
      )}
    >
      {/* 左侧/顶部区域 - 大屏占3列，小屏占满 */}
      <div className={cn('grid gap-5 h-full', 'col-span-1 lg:col-span-3')}>
        <Description gameId={gameId} />
        <Tags gameId={gameId} />
      </div>

      {/* 右侧/底部区域 - 大屏占1列，小屏占满 */}
      <div className={cn('grid gap-5', 'col-span-1')}>
        <Information gameId={gameId} />
        <ExtraInformation gameId={gameId} />
        <RelatedSites gameId={gameId} />
      </div>
    </div>
  )
}

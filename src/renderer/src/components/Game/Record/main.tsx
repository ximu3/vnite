import { cn } from '~/utils'
import { RecordCard } from './RecordCard'
import { ChartCard } from './ChartCard'

export function Record({ gameId }: { gameId: string }): JSX.Element {
  return (
    <div className={cn('w-full h-full flex flex-col gap-5 pt-2 bg-background', '3xl:gap-7')}>
      <RecordCard gameId={gameId} className={cn('w-auto')} />
      <ChartCard gameId={gameId} className={cn('grow')} />
    </div>
  )
}

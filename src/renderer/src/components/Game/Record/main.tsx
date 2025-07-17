import { cn } from '~/utils'
import { RecordCard } from './RecordCard'
import { ChartCard } from './ChartCard'

export function Record({ gameId }: { gameId: string }): React.JSX.Element {
  return (
    <div className={cn('w-full h-full flex flex-col gap-5 pt-2 bg-transparent', '3xl:gap-7')}>
      <RecordCard gameId={gameId} className={cn('')} />
      <ChartCard gameId={gameId} className={cn('')} />
    </div>
  )
}

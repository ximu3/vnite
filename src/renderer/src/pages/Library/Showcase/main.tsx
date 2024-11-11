import { cn } from '~/utils'
import { ScrollArea } from '@ui/scroll-area'
import { RecentGames } from './RecentGames'

export function Showcase(): JSX.Element {
  return (
    <ScrollArea className={cn('w-full h-[100vh] pt-[30px]')}>
      <div className={cn('flex flex-col gap-3')}>
        <RecentGames />
      </div>
    </ScrollArea>
  )
}

import { cn } from '~/utils'
import { ScrollArea } from '@ui/scroll-area'
import { RecentGames } from './RecentGames'
import { Collections } from './Collections'
import { AllGames } from './AllGames'

export function Showcase(): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-3 h-[100vh] pt-[30px]')}>
      <ScrollArea className={cn('w-full')}>
        <RecentGames />
        <Collections />
        <AllGames />
      </ScrollArea>
    </div>
  )
}

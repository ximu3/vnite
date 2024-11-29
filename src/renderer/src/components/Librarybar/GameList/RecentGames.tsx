import { cn } from '~/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { useGameIndexManager } from '~/hooks'
import { GameNav } from '../GameNav'

export function RecentGames(): JSX.Element {
  const { sort: sortGames } = useGameIndexManager()
  const games = sortGames('lastRunDate', 'desc').slice(0, 5)
  return (
    <AccordionItem value="recentGames">
      <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
        <div className={cn('flex flex-row items-center justify-start gap-1')}>
          <div className={cn('text-xs')}>最近游戏</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        {games.map((gameId) => (
          <GameNav key={gameId} gameId={gameId} groupId="all" />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

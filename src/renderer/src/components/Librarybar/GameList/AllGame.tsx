import { cn } from '~/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { useGameIndexManager } from '~/hooks'
import { GameNav } from '../GameNav'

export function AllGame(): JSX.Element {
  const { gameIndex } = useGameIndexManager()
  return (
    <AccordionItem value="all">
      <AccordionTrigger className={cn('bg-accent/30 text-xs rounded-sm p-1 pl-2')}>
        所有游戏
      </AccordionTrigger>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        {Array.from(gameIndex, ([key, game]) => (
          <GameNav key={key} gameId={game.id || ''} groupId={'0'} />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

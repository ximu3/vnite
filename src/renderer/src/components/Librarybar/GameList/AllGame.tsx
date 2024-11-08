import { cn } from '~/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { useGameIndexManager } from '~/hooks'
import { GameNav } from '../GameNav'

export function AllGame(): JSX.Element {
  const { gameIndex } = useGameIndexManager()
  return (
    <AccordionItem value="all">
      <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
        <div className={cn('flex flex-row items-center justify-start gap-1')}>
          <div className={cn('text-xs')}>所有游戏</div>
          <div className={cn('text-2xs text-foreground/50')}>({Array.from(gameIndex).length})</div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        {Array.from(gameIndex, ([key, game]) => (
          <GameNav key={key} gameId={game.id || ''} groupId={'0'} />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

import { Nav } from '../ui/nav'
import { cn } from '~/utils'
import { useGameIndexManager } from '~/hooks'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'

export function GameNav({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  const { gameIndex } = useGameIndexManager()
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Nav
          variant="sidebar"
          className={cn('text-xs p-3 h-4 rounded-none')}
          to={`./${gameId}/${groupId}`}
        >
          <div className={cn('flex flex-row gap-2 items-center')}>
            <span className={cn('icon-[mdi--gamepad-variant] w-5 h-5')}></span>
            <div className={cn('truncate')}>{gameIndex.get(gameId)?.name}</div>
          </div>
        </Nav>
      </ContextMenuTrigger>
      <GameNavCM gameId={gameId} groupId={groupId} />
    </ContextMenu>
  )
}

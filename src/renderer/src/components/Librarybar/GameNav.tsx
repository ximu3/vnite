import { Nav } from '../ui/nav'
import { cn } from '~/utils'
import { useGameMedia, useDBSyncedState } from '~/hooks'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'

export function GameNav({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  const { mediaUrl: icon } = useGameMedia({ gameId, type: 'icon', noToastError: true })
  const { mediaUrl: _cover } = useGameMedia({ gameId, type: 'cover', noToastError: true })
  const { mediaUrl: _background } = useGameMedia({ gameId, type: 'background', noToastError: true })
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Nav
          variant="sidebar"
          className={cn('text-xs p-3 h-5 rounded-none')}
          to={`./games/${gameId}/${groupId}`}
        >
          <div className={cn('flex flex-row gap-2 items-center')}>
            {icon ? (
              <div className={cn('')}>
                <img
                  src={icon}
                  alt="icon"
                  className={cn(
                    'w-[20px] h-[20px] rounded-[0.1rem] shadow-sm shadow-black/70 object-cover'
                  )}
                />
              </div>
            ) : (
              <span className={cn('icon-[mdi--gamepad-variant] w-5 h-5')}></span>
            )}
            <div className={cn('truncate')}>{gameName}</div>
          </div>
        </Nav>
      </ContextMenuTrigger>
      <GameNavCM gameId={gameId} />
    </ContextMenu>
  )
}

import { Nav } from '../ui/nav'
import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { GameNavCM } from '../contextMenu/GameNavCM'
import { ContextMenu, ContextMenuTrigger } from '@ui/context-menu'
import { GameImage } from '@ui/game-image'
import { AttributesDialog } from '../Game/Config/AttributesDialog'
import React from 'react'
import { AddCollectionDialog } from '../dialog/AddCollectionDialog'

export function GameNav({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [isAttributesDialogOpen, setIsAttributesDialogOpen] = React.useState(false)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = React.useState(false)
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Nav
            variant="sidebar"
            className={cn('text-xs p-3 h-5 rounded-none')}
            to={`./games/${gameId}/${groupId}`}
          >
            <div className={cn('flex flex-row gap-2 items-center')}>
              <div className={cn('')}>
                <GameImage
                  gameId={gameId}
                  type="icon"
                  alt="icon"
                  className={cn(
                    'w-[20px] h-[20px] rounded-[0.1rem] shadow-sm shadow-black/70 object-cover'
                  )}
                  fallback={<span className={cn('icon-[mdi--gamepad-variant] w-5 h-5')}></span>}
                />
              </div>
              <div className={cn('truncate')}>{gameName}</div>
            </div>
          </Nav>
        </ContextMenuTrigger>
        <GameNavCM
          gameId={gameId}
          openAttributesDialog={() => setIsAttributesDialogOpen(true)}
          openAddCollectionDialog={() => setIsAddCollectionDialogOpen(true)}
        />
      </ContextMenu>
      {isAttributesDialogOpen && (
        <AttributesDialog gameId={gameId} setIsOpen={setIsAttributesDialogOpen} />
      )}
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameId={gameId} setIsOpen={setIsAddCollectionDialogOpen} />
      )}
    </>
  )
}

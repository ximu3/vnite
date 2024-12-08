import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@ui/context-menu'
import { cn } from '~/utils'
import { ManageMenu } from './ManageMenu'
import { CollectionMenu } from './CollectionMenu'
import { StartGame } from '../../Game/StartGame'
import { StopGame } from '../../Game/StopGame'
import { useRunningGames } from '~/pages/Library/store'

export function GameNavCM({
  gameId,
  openAttributesDialog,
  openAddCollectionDialog
}: {
  gameId: string
  openAttributesDialog: () => void
  openAddCollectionDialog: () => void
}): JSX.Element {
  const { runningGames } = useRunningGames()
  return (
    <ContextMenuContent className={cn('w-40')}>
      <div className={cn('flex flex-row w-full')}>
        {runningGames.includes(gameId) ? (
          <StopGame className={cn('w-full max-w-none flex')} gameId={gameId} />
        ) : (
          <StartGame className={cn('w-full max-w-none flex')} gameId={gameId} />
        )}
      </div>
      <ContextMenuSeparator />
      <CollectionMenu gameId={gameId} openAddCollectionDialog={openAddCollectionDialog} />
      <ContextMenuSeparator />
      <ManageMenu gameId={gameId} />
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={openAttributesDialog}>
        <div>属性</div>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

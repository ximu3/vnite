import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { cn } from '~/utils'
import { useCollections } from '~/hooks'
import { AddCollectionDialog } from '../../dialog/AddCollectionDialog'
import { AttributesDialog } from '../../Game/Config/AttributesDialog'
import { ManageMenu } from './ManageMenu'
import { StartGame } from '../../Game/StartGame'
import { StopGame } from '../../Game/StopGame'
import { useRunningGames } from '~/pages/Library/store'

export function GameNavCM({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  const { collections, addGameToCollection, removeGameFromCollection } = useCollections()
  const { runningGames } = useRunningGames()
  // 获取该游戏所在的所有收藏ID
  const gameInCollectionsId = Object.entries(collections)
    .filter(([, value]) => value.games.includes(gameId))
    .map(([key]) => key)
  let collectionId = ''
  if (groupId.startsWith('collection:')) {
    collectionId = groupId.replace('collection:', '')
  }
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
      {collectionId && (
        <ContextMenuItem onClick={() => removeGameFromCollection(collectionId, gameId)}>
          <div>移出该收藏</div>
        </ContextMenuItem>
      )}
      <ContextMenuSub>
        <ContextMenuSubTrigger>添加至</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {Object.entries(collections)
            .filter(([key]) => !gameInCollectionsId.includes(key))
            .map(([key, value]) => (
              <ContextMenuItem key={key} onClick={() => addGameToCollection(key, gameId)} inset>
                {value.name}
              </ContextMenuItem>
            ))}
          {Object.entries(collections).filter(([key]) => !gameInCollectionsId.includes(key))
            .length > 0 && <ContextMenuSeparator />}
          <AddCollectionDialog gameId={gameId}>
            <ContextMenuItem onSelect={(e) => e.preventDefault()}>
              <div className={cn('flex flex-row gap-2 items-center w-full')}>
                <span className={cn('icon-[mdi--add] w-4 h-4')}></span>
                <div>新收藏</div>
              </div>
            </ContextMenuItem>
          </AddCollectionDialog>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ManageMenu gameId={gameId} />
      <ContextMenuSeparator />
      <AttributesDialog gameId={gameId}>
        <ContextMenuItem onSelect={(e) => e.preventDefault()}>
          <div>属性</div>
        </ContextMenuItem>
      </AttributesDialog>
    </ContextMenuContent>
  )
}

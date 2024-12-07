import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { useCollections } from '~/hooks'
import { cn } from '~/utils'

export function CollectionMenu({
  gameId,
  openAddCollectionDialog
}: {
  gameId: string
  openAddCollectionDialog: () => void
}): JSX.Element {
  const { collections, addGameToCollection, removeGameFromCollection } = useCollections()

  const gameInCollectionsId = Object.entries(collections)
    .filter(([, value]) => value.games.includes(gameId))
    .map(([key]) => key)

  return (
    <ContextMenuGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger>添加至</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent>
            {Object.entries(collections)
              .filter(([key]) => !gameInCollectionsId.includes(key))
              .map(([key, value]) => (
                <ContextMenuItem key={key} onClick={() => addGameToCollection(key, gameId)}>
                  {value.name}
                </ContextMenuItem>
              ))}

            {Object.entries(collections).filter(([key]) => !gameInCollectionsId.includes(key))
              .length > 0 && <ContextMenuSeparator />}

            <ContextMenuItem onSelect={openAddCollectionDialog}>
              <div className={cn('flex flex-row gap-2 items-center w-full')}>
                <span className={cn('icon-[mdi--add] w-4 h-4')}></span>
                <div>新收藏</div>
              </div>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>

      {gameInCollectionsId.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>移除出</ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent>
              {Object.entries(collections)
                .filter(([key]) => gameInCollectionsId.includes(key))
                .map(([key, value]) => (
                  <ContextMenuItem key={key} onSelect={() => removeGameFromCollection(key, gameId)}>
                    {value.name}
                  </ContextMenuItem>
                ))}
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      )}
    </ContextMenuGroup>
  )
}

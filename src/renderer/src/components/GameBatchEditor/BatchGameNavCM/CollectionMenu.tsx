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
  gameIds,
  openAddCollectionDialog
}: {
  gameIds: string[]
  openAddCollectionDialog: () => void
}): JSX.Element {
  const { collections, addGamesToCollection, removeGamesFromCollection } = useCollections()

  // Get the collection of all selected games
  const collectionsStatus = Object.entries(collections).reduce<{
    inAll: string[] // All selected games in the collection
    inSome: string[] // Selected games in the collection
  }>(
    (acc, [collectionId, collection]) => {
      const gamesInCollection = gameIds.filter((gameId) => collection.games.includes(gameId)).length

      if (gamesInCollection === gameIds.length) {
        // All selected games are in this collection
        acc.inAll.push(collectionId)
      } else if (gamesInCollection > 0) {
        // Some of the selected games in this collection
        acc.inSome.push(collectionId)
      }
      return acc
    },
    { inAll: [], inSome: [] }
  )

  // Batch add games to favorites
  const handleAddToCollection = (collectionId: string): void => {
    addGamesToCollection(collectionId, gameIds)
  }

  // Batch Remove Games from Favorites
  const handleRemoveFromCollection = (collectionId: string): void => {
    removeGamesFromCollection(collectionId, gameIds)
  }
  return (
    <ContextMenuGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger>批量添加至</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent>
            {Object.entries(collections)
              // Filter out favorites that all selected games are already in
              .filter(([key]) => !collectionsStatus.inAll.includes(key))
              .map(([key, value]) => (
                <ContextMenuItem key={key} onClick={() => handleAddToCollection(key)}>
                  <div className={cn('flex flex-row gap-2 items-center w-full')}>{value.name}</div>
                </ContextMenuItem>
              ))}

            {Object.entries(collections).filter(([key]) => !collectionsStatus.inAll.includes(key))
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

      {(collectionsStatus.inAll.length > 0 || collectionsStatus.inSome.length > 0) && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>批量移除出</ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent>
              {Object.entries(collections)
                .filter(
                  ([key]) =>
                    collectionsStatus.inAll.includes(key) || collectionsStatus.inSome.includes(key)
                )
                .map(([key, value]) => (
                  <ContextMenuItem key={key} onSelect={() => handleRemoveFromCollection(key)}>
                    <div className={cn('flex flex-row gap-2 items-center w-full')}>
                      {value.name}
                    </div>
                  </ContextMenuItem>
                ))}
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      )}
    </ContextMenuGroup>
  )
}
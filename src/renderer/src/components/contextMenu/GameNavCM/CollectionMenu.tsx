import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'

export function CollectionMenu({
  gameId,
  openAddCollectionDialog
}: {
  gameId: string
  openAddCollectionDialog: () => void
}): JSX.Element {
  const {
    documents: collections,
    addGameToCollection,
    removeGameFromCollection
  } = useGameCollectionStore()
  const gameInCollectionsId = Object.entries(collections)
    .filter(([, value]) => value.games.includes(gameId))
    .map(([key]) => key)
  return (
    <ContextMenuGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger>添加至</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="max-w-[300px]">
            {Object.entries(collections)
              .filter(([key]) => !gameInCollectionsId.includes(key))
              .map(([key, value]) => (
                <ContextMenuItem key={key} onClick={() => addGameToCollection(key, gameId)} inset>
                  <span className="truncate">{value.name}</span>
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
            <ContextMenuSubContent className="max-w-[300px]">
              {Object.entries(collections)
                .filter(([key]) => gameInCollectionsId.includes(key))
                .map(([key, value]) => (
                  <ContextMenuItem
                    key={key}
                    onSelect={() => removeGameFromCollection(key, gameId)}
                    className={cn('pl-3')}
                  >
                    <span className="truncate">{value.name}</span>
                  </ContextMenuItem>
                ))}
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      )}
    </ContextMenuGroup>
  )
}

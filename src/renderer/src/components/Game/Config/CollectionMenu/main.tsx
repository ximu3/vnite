import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@ui/dropdown-menu'
import { useCollections } from '~/hooks'
import { AddCollectionDialog } from '../../../dialog/AddCollectionDialog'
import { cn } from '~/utils'

export function CollectionMenu({ gameId }: { gameId: string }): JSX.Element {
  const { collections, addGameToCollection, removeGameFromCollection } = useCollections()
  const gameInCollectionsId = Object.entries(collections)
    .filter(([, value]) => value.games.includes(gameId))
    .map(([key]) => key)
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>添加至</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            {Object.entries(collections)
              .filter(([key]) => !gameInCollectionsId.includes(key))
              .map(([key, value]) => (
                <DropdownMenuItem key={key} onClick={() => addGameToCollection(key, gameId)} inset>
                  {value.name}
                </DropdownMenuItem>
              ))}
            {Object.entries(collections).filter(([key]) => !gameInCollectionsId.includes(key))
              .length > 0 && <DropdownMenuSeparator />}
            <AddCollectionDialog gameId={gameId}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className={cn('flex flex-row gap-2 items-center w-full')}>
                  <span className={cn('icon-[mdi--add] w-4 h-4')}></span>
                  <div>新收藏</div>
                </div>
              </DropdownMenuItem>
            </AddCollectionDialog>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      {gameInCollectionsId.length > 0 && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>移除出</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {Object.entries(collections)
                .filter(([key]) => gameInCollectionsId.includes(key))
                .map(([key, value]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => removeGameFromCollection(key, gameId)}
                    className={cn('pl-3')}
                  >
                    {value.name}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      )}
    </DropdownMenuGroup>
  )
}
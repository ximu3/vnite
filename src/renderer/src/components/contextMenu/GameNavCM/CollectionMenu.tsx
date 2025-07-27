import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '~/components/ui/context-menu'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameCollectionStore } from '~/stores'
import { cn } from '~/utils'

export function CollectionMenu({
  gameId,
  openAddCollectionDialog
}: {
  gameId: string
  openAddCollectionDialog: () => void
}): React.JSX.Element {
  const {
    documents: collections,
    addGameToCollection,
    removeGameFromCollection
  } = useGameCollectionStore()
  const gameInCollectionsId = Object.entries(collections)
    .filter(([, value]) => value.games.includes(gameId))
    .map(([key]) => key)
  // Sort collections by the sort field
  const sortedCollections = useMemo(() => {
    return Object.entries(collections).sort(([, a], [, b]) => a.sort - b.sort)
  }, [collections])
  const { t } = useTranslation('game')
  return (
    <ContextMenuGroup>
      {/* Add to Collection */}
      <ContextMenuSub>
        <ContextMenuSubTrigger>{t('detail.collection.addTo')}</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="max-w-[300px]">
            {/* Display collections that do not contain the game */}
            <div className={cn('max-h-[224px] overflow-auto scrollbar-base-thin')}>
              {sortedCollections
                .filter(([key]) => !gameInCollectionsId.includes(key))
                .map(([key, value]) => (
                  <ContextMenuItem key={key} onClick={() => addGameToCollection(key, gameId)} inset>
                    <span className="truncate">{value.name}</span>
                  </ContextMenuItem>
                ))}
            </div>
            {sortedCollections.filter(([key]) => !gameInCollectionsId.includes(key)).length > 0 && (
              <ContextMenuSeparator />
            )}
            {/* Add New Collection */}
            <ContextMenuItem onSelect={openAddCollectionDialog}>
              <div className={cn('flex flex-row gap-2 items-center w-full')}>
                <span className={cn('icon-[mdi--add] w-4 h-4')}></span>
                <div>{t('detail.collection.newCollection')}</div>
              </div>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
      {/* Remove from Collection */}
      {gameInCollectionsId.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t('detail.collection.removeFrom')}</ContextMenuSubTrigger>
          <ContextMenuPortal>
            {/* Only show if the game is in at least one collection */}
            <ContextMenuSubContent className="max-w-[300px]">
              {sortedCollections
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

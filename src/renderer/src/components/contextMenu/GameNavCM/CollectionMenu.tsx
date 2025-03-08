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
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation('game')
  return (
    <ContextMenuGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger>{t('detail.collection.addTo')}</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent className="max-w-[300px]">
            <div className={cn('max-h-[224px] overflow-auto scrollbar-base-thin')}>
              {Object.entries(collections)
                .filter(([key]) => !gameInCollectionsId.includes(key))
                .map(([key, value]) => (
                  <ContextMenuItem key={key} onClick={() => addGameToCollection(key, gameId)} inset>
                    <span className="truncate">{value.name}</span>
                  </ContextMenuItem>
                ))}
            </div>

            {Object.entries(collections).filter(([key]) => !gameInCollectionsId.includes(key))
              .length > 0 && <ContextMenuSeparator />}

            <ContextMenuItem onSelect={openAddCollectionDialog}>
              <div className={cn('flex flex-row gap-2 items-center w-full')}>
                <span className={cn('icon-[mdi--add] w-4 h-4')}></span>
                <div>{t('detail.collection.newCollection')}</div>
              </div>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>

      {gameInCollectionsId.length > 0 && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t('detail.collection.removeFrom')}</ContextMenuSubTrigger>
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

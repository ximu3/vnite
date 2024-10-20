import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { Button } from '../ui/button'
import { cn } from '~/utils'
import { useCollections } from '~/utils'

export function GameNavCM({ gameId, groupId }: { gameId: string; groupId: string }): JSX.Element {
  const { collections, addGameToCollection, removeGameFromCollection } = useCollections()
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
      <div className={cn('w-full flex justify-center items-center')}>
        <Button variant="default" className={cn('w-full flex items-center pl-1')}>
          <div className={cn('flex flex-row gap-1 items-center justify-start')}>
            <span className={cn('icon-[mdi--play-outline] w-6 h-6')}></span>
            开始游戏
          </div>
        </Button>
      </div>
      <ContextMenuSeparator />
      {collectionId && (
        <ContextMenuItem onClick={() => removeGameFromCollection(collectionId, gameId)} inset>
          <div>移出该收藏</div>
        </ContextMenuItem>
      )}
      <ContextMenuSub>
        <ContextMenuSubTrigger inset>添加至</ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-40">
          {Object.entries(collections)
            .filter(([key]) => !gameInCollectionsId.includes(key))
            .map(([key, value]) => (
              <ContextMenuItem key={key} onClick={() => addGameToCollection(key, gameId)} inset>
                {value.name}
              </ContextMenuItem>
            ))}
          {Object.entries(collections).filter(([key]) => !gameInCollectionsId.includes(key))
            .length > 0 && <ContextMenuSeparator />}
          <ContextMenuItem inset>
            <div className={cn('flex flex-row gap-2 items-center')}>
              <span className={cn('icon-[mdi--add] w-4 h-4')}></span>
              <div>新收藏</div>
            </div>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem className={cn('text-sm')} inset>
        属性
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

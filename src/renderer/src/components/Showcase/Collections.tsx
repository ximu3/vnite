import { cn } from '~/utils'
import { Separator } from '@ui/separator'
import { useCollections } from '~/hooks'
import { CollectionPoster } from './posters/CollectionPoster'

export function Collections(): JSX.Element {
  const { collections } = useCollections()

  return (
    <div className={cn('w-full flex flex-col gap-1 pt-3')}>
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('text-accent-foreground flex-shrink-0')}>我的收藏</div>

        {/* 分割线容器 */}
        <div className={cn('flex items-center justify-center flex-grow pr-5')}>
          <Separator className={cn('flex-grow')} />
        </div>
      </div>

      {/* 游戏列表容器 */}
      <div
        className={cn(
          'flex flex-row gap-6 grow flex-wrap',
          'w-full',
          'pt-2 pb-6 pl-5' // 添加内边距以显示阴影
        )}
      >
        {/* 包装器确保每个 Poster 保持固定宽度 */}
        {Object.keys(collections).map((collectionId) => (
          <div
            key={collectionId}
            className={cn(
              'flex-shrink-0' // 防止压缩
            )}
          >
            <CollectionPoster collctionId={collectionId} />
          </div>
        ))}
      </div>
    </div>
  )
}

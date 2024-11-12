import { HoverSquareCardAnimation } from '~/components/animations/HoverSquareCard'
import { cn } from '~/utils'
import { useNavigate } from 'react-router-dom'
import { useGameMedia, useCollections } from '~/hooks'

export function CollectionPoster({
  collctionId,
  className
}: {
  collctionId: string
  className?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { collections } = useCollections()
  const collectionName = collections[collctionId].name
  const gameId = collections[collctionId].games[0]
  const length = collections[collctionId].games.length
  const { mediaUrl: cover } = useGameMedia({ gameId, type: 'cover' })

  return (
    <div
      className={cn(
        'group relative overflow-hidden shadow-custom-initial cursor-pointer w-[160px] h-[160px] rounded-[0.3rem]',
        'transition-border duration-300 ease-in-out',
        'border-2 border-transparent', // 默认透明边框
        'hover:border-primary hover:border-2', // hover时显示主题色边框
        '3xl:w-[190px] 3xl:h-[190px]'
      )}
      onClick={() => navigate(`/library/collections/${collctionId}`)}
    >
      {/* 添加一个背景遮罩层 */}
      <div
        className={cn(
          'absolute inset-0 bg-muted/40 backdrop-blur-sm z-10 border-t-0.5 border-white/30 pointer-events-none'
        )}
      />

      {/* HoverBigCardAnimation 层 */}
      <div className="relative z-0">
        <HoverSquareCardAnimation className={cn('rounded-none')}>
          <img
            src={cover}
            alt={gameId}
            className={cn(
              'w-full h-full cursor-pointer object-cover',
              '3xl:w-full 3xl:h-full',
              className
            )}
          />
        </HoverSquareCardAnimation>
      </div>

      {/* 文字内容层 */}
      <div
        className={cn(
          'absolute inset-0 z-20 mt-7',
          'flex items-center justify-center',
          'pointer-events-none' // 确保点击事件传递到底层
        )}
      >
        <div className="flex flex-col gap-1 items-center justify-center">
          <div className={cn('text-accent-foreground text-lg font-semibold')}>{collectionName}</div>
          <div className={cn('text-accent-foreground/70')}>{`( ${length} )`}</div>
        </div>
      </div>
    </div>
  )
}

import { HoverSquareCardAnimation } from '~/components/animations/HoverSquareCard'
import { cn } from '~/utils'
import { useNavigate } from 'react-router-dom'
import { useGameMedia, useDBSyncedState } from '~/hooks'

export function GamePoster({
  gameId,
  className,
  isShowGameName = false,
  additionalInfo
}: {
  gameId: string
  className?: string
  isShowGameName?: boolean
  additionalInfo?: string
}): JSX.Element {
  const navigate = useNavigate()
  const { mediaUrl: cover } = useGameMedia({ gameId, type: 'cover', noToastError: true })
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])

  return (
    <div
      className={cn(
        'group relative overflow-hidden cursor-pointer rounded-[0.3rem]',
        'transition-border duration-300 ease-in-out',
        'border-2 border-transparent', // 默认透明边框
        'hover:border-primary hover:border-2', // hover时显示主题色边框
        className
      )}
      onClick={() => navigate(`/library/games/${gameId}/#all`)}
    >
      {/* 添加一个背景遮罩层 */}
      {isShowGameName && (
        <div
          className={cn(
            'absolute inset-0 bg-muted/40 backdrop-blur-sm z-10 border-t-0.5 border-white/30 pointer-events-none'
          )}
        />
      )}

      {/* HoverBigCardAnimation 层 */}

      <div className="relative z-0">
        <HoverSquareCardAnimation className={cn('rounded-none shadow-none')}>
          {cover ? (
            <img
              src={cover}
              alt={gameId}
              className={cn(
                'w-full h-full cursor-pointer object-cover',
                '3xl:w-full 3xl:h-full',
                className
              )}
            />
          ) : (
            <div
              className={cn(
                'w-full h-full cursor-pointer object-cover flex items-center justify-center',
                '3xl:w-full 3xl:h-full',
                className
              )}
            ></div>
          )}
        </HoverSquareCardAnimation>
      </div>

      {/* 文字内容层 */}
      {isShowGameName && (
        <div
          className={cn(
            'absolute inset-0 z-20 mt-7',
            'flex items-center justify-center',
            'pointer-events-none' // 确保点击事件传递到底层
          )}
        >
          <div className="flex flex-col gap-1 items-center justify-center">
            <div className={cn('text-accent-foreground text-xl font-bold')}>{gameName}</div>
            <div className={cn('text-accent-foreground/80 text-lg')}>{additionalInfo}</div>
          </div>
        </div>
      )}
    </div>
  )
}

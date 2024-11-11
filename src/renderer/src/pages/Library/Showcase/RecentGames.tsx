import { cn } from '~/utils'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import { useGameIndexManager } from '~/hooks'
import { Poster } from './Poster'
import { useRef } from 'react'

export function RecentGames(): JSX.Element {
  const { sort: sortGames } = useGameIndexManager()
  const games = sortGames('lastRunDate', 'desc')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right'): void => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 300
    const container = scrollContainerRef.current
    container.scrollTo({
      left: container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    })
  }

  return (
    <div className={cn('w-full flex flex-col gap-2 pt-3')}>
      <div className={cn('flex flex-row items-center justify-between pl-5')}>
        <div className={cn('text-accent-foreground')}>最近游戏</div>
        <div className={cn('flex flex-row gap-2')}>
          <Button
            className={cn('hover:bg-transparent')}
            variant={'ghost'}
            size={'icon'}
            onClick={() => scroll('left')}
          >
            <span className={cn('icon-[mdi--keyboard-arrow-left] w-6 h-6')}></span>
          </Button>
          <Button
            className={cn('hover:bg-transparent')}
            variant={'ghost'}
            size={'icon'}
            onClick={() => scroll('right')}
          >
            <span className={cn('icon-[mdi--keyboard-arrow-right] w-6 h-6')}></span>
          </Button>
        </div>
      </div>
      <Separator className={cn('ml-5')} />
      {/* 游戏列表容器 */}
      <div
        ref={scrollContainerRef}
        className={cn(
          'flex flex-row gap-6 grow',
          'w-full overflow-x-auto scrollbar-none scroll-smooth',
          'pt-3 pb-6 pl-5' // 添加内边距以显示阴影
        )}
      >
        {/* 包装器确保每个 Poster 保持固定宽度 */}
        {games.map((game) => (
          <div
            key={game}
            className={cn(
              'flex-shrink-0' // 防止压缩
            )}
          >
            <Poster gameId={game} />
          </div>
        ))}
      </div>
    </div>
  )
}

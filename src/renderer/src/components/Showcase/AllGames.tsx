import { cn } from '~/utils'
import { Separator } from '@ui/separator'
import { Button } from '@ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { useGameIndexManager, useGameTimers } from '~/hooks'
import { GamePoster } from './posters/GamePoster'
import { useEffect, useState } from 'react'

export function AllGames(): JSX.Element {
  const [by, setBy] = useState('name')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const { sort } = useGameIndexManager()
  const [games, setGames] = useState(sort(by, order))
  const { getSortedGameIds } = useGameTimers()
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }
  useEffect(() => {
    if (by === 'playingTime') {
      setGames(getSortedGameIds(order))
    } else {
      setGames(sort(by, order))
    }
  }, [by, order, sort, getSortedGameIds])

  return (
    <div className={cn('w-full flex flex-col gap-1 pt-3')}>
      <div className={cn('flex flex-row items-center gap-5 justify-center pl-5')}>
        <div className={cn('flex flex-row gap-5 items-center justify-center')}>
          <div className={cn('text-accent-foreground flex-shrink-0')}>所有游戏</div>
          <div className={cn('flex flex-row gap-1 items-center justify-center')}>
            <div className={cn('text-sm')}>排序依据：</div>
            <Select value={by} onValueChange={setBy} defaultValue="name">
              <SelectTrigger className={cn('w-[120px] h-[26px] text-xs')}>
                <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>排序依据</SelectLabel>
                  <SelectItem value="name">名称</SelectItem>
                  <SelectItem value="releaseDate">发布日期</SelectItem>
                  <SelectItem value="lastRunDate">最后运行日期</SelectItem>
                  <SelectItem value="addDate">添加日期</SelectItem>
                  <SelectItem value="playingTime">游玩时间</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={'outline'}
            size={'icon'}
            className={cn('h-[26px] w-[26px] -ml-3')}
            onClick={toggleOrder}
          >
            {order === 'asc' ? (
              <span className={cn('icon-[mdi--arrow-up] w-4 h-4')}></span>
            ) : (
              <span className={cn('icon-[mdi--arrow-down] w-4 h-4')}></span>
            )}
          </Button>
        </div>

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
        {games.map((gameId) => (
          <div
            key={gameId}
            className={cn(
              'flex-shrink-0' // 防止压缩
            )}
          >
            <GamePoster gameId={gameId} />
          </div>
        ))}
      </div>
    </div>
  )
}

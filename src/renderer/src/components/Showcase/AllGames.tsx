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
import { useGameIndexManager, useDBSyncedState } from '~/hooks'
import { GamePoster } from './posters/GamePoster'

export function AllGames(): JSX.Element {
  const [by, setBy] = useDBSyncedState<
    'name' | 'releaseDate' | 'lastRunDate' | 'addDate' | 'playingTime'
  >('name', 'config.json', ['others', 'showcase', 'sort', 'by'])
  const [order, setOrder] = useDBSyncedState<'desc' | 'asc'>('desc', 'config.json', [
    'others',
    'showcase',
    'sort',
    'order'
  ])
  const { sort } = useGameIndexManager()
  const games = sort(by, order)
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }
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

        {/* Split Line Container */}
        <div className={cn('flex items-center justify-center flex-grow pr-5')}>
          <Separator className={cn('flex-grow')} />
        </div>
      </div>

      {/* Game List Container */}
      <div
        className={cn(
          'flex flex-row grow flex-wrap gap-6 justify-between',
          'w-full',
          'pt-2 pl-5 pr-5'
        )}
      >
        {/* The wrapper ensures that each Poster maintains a fixed width */}
        {games.map((gameId) => (
          <div
            key={gameId}
            className={cn(
              'flex-shrink-0' // Preventing compression
            )}
          >
            <GamePoster gameId={gameId} />
          </div>
        ))}
        {Array.from({ length: 14 }).map((_, index) => (
          <div key={index} className={cn('w-[148px] h-0', '3xl:w-[176px]')}></div>
        ))}
      </div>
    </div>
  )
}

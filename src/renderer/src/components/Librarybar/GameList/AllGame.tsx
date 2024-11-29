import { cn } from '~/utils'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
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
import { ContextMenuContent, ContextMenuTrigger, ContextMenu } from '@ui/context-menu'
import { useGameIndexManager, useDBSyncedState } from '~/hooks'
import { GameNav } from '../GameNav'
import { useEffect, useState } from 'react'

export function AllGame(): JSX.Element {
  const [by, setBy] = useDBSyncedState<
    'name' | 'releaseDate' | 'lastRunDate' | 'addDate' | 'playingTime'
  >('addDate', 'config.json', ['others', 'gameList', 'sort', 'by'])
  const [order, setOrder] = useDBSyncedState<'desc' | 'asc'>('desc', 'config.json', [
    'others',
    'gameList',
    'sort',
    'order'
  ])
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }
  const { sort } = useGameIndexManager()
  const [games, setGames] = useState(sort(by, order))

  useEffect(() => {
    setGames(sort(by, order))
  }, [by, order, sort])

  return (
    <AccordionItem value="all">
      <ContextMenu>
        <ContextMenuTrigger className={cn('rounded-none')}>
          <AccordionTrigger className={cn('bg-accent/30 text-xs p-1 pl-2')}>
            <div className={cn('flex flex-row items-center justify-start gap-1')}>
              <div className={cn('text-xs')}>所有游戏</div>
              <div className={cn('text-2xs text-foreground/50')}>({games.length})</div>
            </div>
          </AccordionTrigger>
        </ContextMenuTrigger>
        <ContextMenuContent className={cn('w-full p-3')}>
          <div className={cn('flex flex-row gap-5 items-center justify-center')}>
            <div className={cn('flex flex-row gap-1 items-center justify-center')}>
              <div className={cn('text-sm whitespace-nowrap')}>排序依据：</div>
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
        </ContextMenuContent>
      </ContextMenu>
      <AccordionContent className={cn('rounded-none pt-1 flex flex-col gap-1')}>
        {games.map((gameId) => (
          <GameNav key={gameId} gameId={gameId} groupId="all" />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

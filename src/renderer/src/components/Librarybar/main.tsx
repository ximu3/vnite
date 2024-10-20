import { cn } from '~/utils'
import { Nav } from '@ui/nav'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Input } from '@ui/input'
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
import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { GameList } from './GameList/index'

export function Librarybar(): JSX.Element {
  const [selectedGroup, setSelectedGroup] = useState('collection')
  const [query, setQuery] = useState('')
  return (
    <div className={cn('flex flex-col gap-6 bg-card w-full h-full pt-2')}>
      <div className={cn('flex flex-col gap-3 p-3 pb-0')}>
        <div className={cn('flex flex-row gap-2')}>
          <div className={cn('grow')}>
            <Nav variant="librarybar" to="./home" className={cn('')}>
              <div className={cn('flex flex-row gap-2 items-center justify-start')}>
                <span className={cn('icon-[mdi--home] w-5 h-5')}></span>
                <span>主页</span>
              </div>
            </Nav>
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger>
                <Nav variant="librarybar" to="./collection" className={cn('')}>
                  <div className={cn('flex flex-row gap-2 items-center justify-start')}>
                    <span className={cn('icon-[mdi--collection] w-5 h-5')}></span>
                  </div>
                </Nav>
              </TooltipTrigger>
              <TooltipContent side="right">收藏</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className={cn('flex flex-col gap-3 p-3 pt-0')}>
        <div className={cn('flex flex-row gap-2')}>
          <div className={cn('grow')}>
            <Tooltip>
              <TooltipTrigger className={cn('w-full')}>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                支持通过游戏名、开发者、发行日期等元数据进行搜索
              </TooltipContent>
            </Tooltip>
          </div>
          <div>
            <Popover>
              <Tooltip>
                <TooltipTrigger>
                  <PopoverTrigger asChild>
                    <Button variant="default" size={'icon'}>
                      <span className={cn('icon-[mdi--filter-variant] w-5 h-5')}></span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">高级筛选</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-80 h-80"></PopoverContent>
            </Popover>
          </div>
        </div>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>分组依据</SelectLabel>
              <SelectItem value="collection">收藏</SelectItem>
              <SelectItem value="developer">开发商</SelectItem>
              <SelectItem value="category">类别</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
    </div>
  )
}

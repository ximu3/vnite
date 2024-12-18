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
import { GameList } from './GameList'
import { Filter } from './Filter'
import { useFilterStore } from './Filter/store'
import { isEqual } from 'lodash'
import { create } from 'zustand'

interface LibrarybarStore {
  query: string
  setQuery: (query: string) => void
  refreshGameList: () => void
}

export const useLibrarybarStore = create<LibrarybarStore>((set) => ({
  query: '',
  setQuery: (query: string): void => set({ query }),
  refreshGameList: (): void => {
    set({ query: '-1' })
    setTimeout(() => set({ query: '' }), 1)
  }
}))

export function Librarybar(): JSX.Element {
  const [selectedGroup, setSelectedGroup] = useState('collection')
  const { query, setQuery } = useLibrarybarStore()
  const { toggleFilterMenu, filter } = useFilterStore()
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
                <Nav variant="librarybar" to="./collections" className={cn('')}>
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
      <div className={cn('flex flex-col gap-3 p-3 pt-0 pr-0 grow h-0')}>
        <div className={cn('flex flex-row gap-2 pr-3')}>
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
            <Filter>
              <Button onClick={toggleFilterMenu} variant="default" size={'icon'}>
                <span
                  className={cn(
                    isEqual(filter, {})
                      ? 'icon-[mdi--filter-variant] w-5 h-5'
                      : 'icon-[mdi--filter-variant-plus] w-5 h-5'
                  )}
                ></span>
              </Button>
            </Filter>
          </div>
        </div>
        <div className={cn('pr-3')}>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="pr-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>分组依据</SelectLabel>
                <SelectItem value="collection">收藏</SelectItem>
                <SelectItem value="developers">开发商</SelectItem>
                <SelectItem value="genres">类别</SelectItem>
                <SelectItem value="playStatus">游玩状态</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
    </div>
  )
}

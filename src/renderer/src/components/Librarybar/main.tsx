import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Nav } from '@ui/nav'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { isEqual } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { create } from 'zustand'
import { useDBSyncedState } from '~/hooks'
import { cn } from '~/utils'
import { useGameBatchEditorStore } from '../GameBatchEditor/store'
import { Filter } from './Filter'
import { useFilterStore } from './Filter/store'
import { GameList } from './GameList'

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
  const location = useLocation()
  const [selectedGroup, setSelectedGroup] = useDBSyncedState('collection', 'config.json', [
    'others',
    'gameList',
    'selectedGroup'
  ])
  const { query, setQuery } = useLibrarybarStore()
  const { toggleFilterMenu, filter } = useFilterStore()
  const { clearGameIds, gameIds } = useGameBatchEditorStore()
  const [isGameNavVisible, setIsGameNavVisible] = useState(true)
  const visibilityTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // clear batchEditor gameList when switching to a non-game-detail page and not in batchMode
    if (!location.pathname.includes(`/library/games/`) && gameIds.length < 2) {
      clearGameIds()
    }
  }, [location.pathname])

  const scrollToCurrentGame = (): void => {
    const currentGameId = location.pathname.split('/games/')[1]?.split('/')[0]
    const currentGroupId = location.pathname.split('/games/')[1]?.split('/')[1]
    if (currentGameId && currentGroupId) {
      const element = document.querySelector(
        `[data-game-id="${currentGameId}"][data-group-id="${currentGroupId}"]`
      )
      element?.scrollIntoView({ behavior: 'instant', block: 'center' })
    }
  }

  useEffect(() => {
    const currentGameId = location.pathname.split('/games/')[1]?.split('/')[0]
    const currentGroupId = location.pathname.split('/games/')[1]?.split('/')[1]
    if (!currentGameId && currentGroupId) return

    const gameElement = document.querySelector(
      `[data-game-id="${currentGameId}"][data-group-id="${currentGroupId}"]`
    )
    if (!gameElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (visibilityTimeout.current) {
          clearTimeout(visibilityTimeout.current)
        }

        // Use requestAnimationFrame and setTimeout to reduce the frequency of state updates.
        visibilityTimeout.current = setTimeout(() => {
          requestAnimationFrame(() => {
            setIsGameNavVisible(entry.isIntersecting)
          })
        }, 150)
      },
      {
        root: null,
        threshold: 0.5,
        rootMargin: '20px'
      }
    )

    observer.observe(gameElement)

    return (): void => {
      observer.disconnect()
      if (visibilityTimeout.current) {
        clearTimeout(visibilityTimeout.current)
      }
    }
  }, [location.pathname])

  return (
    <div className={cn('flex flex-col gap-6 bg-card w-full h-full pt-2 relative group')}>
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
      <div className={cn('flex flex-col gap-3 p-3 pt-0 pr-0 grow h-0 pb-0')}>
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
                <SelectItem value="none">无分组</SelectItem>
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
      {location.pathname.includes('/library/games/') && (
        <Button
          size="icon"
          className={cn(
            'absolute bottom-4 right-4 transition-all duration-200 shadow-md hover:bg-primary',
            'transform',
            isGameNavVisible
              ? 'opacity-0 translate-y-2 pointer-events-none'
              : 'opacity-0 translate-y-0 group-hover:opacity-100'
          )}
          onClick={scrollToCurrentGame}
        >
          <span className={cn('icon-[mdi--crosshairs-gps] w-5 h-5')} />
        </Button>
      )}
    </div>
  )
}

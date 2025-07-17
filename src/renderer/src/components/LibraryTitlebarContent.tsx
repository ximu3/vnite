import { Button } from '~/components/ui/button'
import { ClearableInput } from '~/components/ui/input'
import { Nav } from '~/components/ui/nav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { isEqual } from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { Filter } from './Librarybar/Filter'
import { useFilterStore } from './Librarybar/Filter/store'
import { SortMenu } from './Librarybar/SortMenu'
import { useLibrarybarStore } from './Librarybar/store'

export function LibraryTitlebarContent(): React.JSX.Element {
  const { t } = useTranslation('game')
  const [selectedGroup, setSelectedGroup] = useConfigState('game.gameList.selectedGroup')
  const query = useLibrarybarStore((state) => state.query)
  const setQuery = useLibrarybarStore((state) => state.setQuery)
  const filter = useFilterStore((state) => state.filter)
  const toggleFilterMenu = useFilterStore((state) => state.toggleFilterMenu)
  const clearFilter = useFilterStore((state) => state.clearFilter)

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const toggleSortMenu = (): void => {
    setIsSortMenuOpen(!isSortMenuOpen)
  }

  // 获取分组显示文本
  const getGroupDisplayText = (groupValue: string): string => {
    switch (groupValue) {
      case 'none':
        return t('librarybar.groups.none')
      case 'collection':
        return t('librarybar.groups.collection')
      case 'metadata.developers':
        return t('librarybar.groups.developers')
      case 'metadata.genres':
        return t('librarybar.groups.genres')
      case 'record.playStatus':
        return t('librarybar.groups.playStatus')
      default:
        return t('librarybar.groups.none')
    }
  }

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      {/* 搜索框 */}
      <div className="w-[250px]">
        <Tooltip>
          <TooltipTrigger className="w-full">
            <ClearableInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('librarybar.search.placeholder')}
              onClear={() => setQuery('')}
              className="h-[32px] min-h-0 "
              inputClassName="h-[32px] min-h-0 bg-background/50 border-0"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('librarybar.search.tooltip')}</TooltipContent>
        </Tooltip>
      </div>
      {/* 主页按钮 */}
      <Tooltip>
        <TooltipTrigger>
          <Nav
            variant="librarybar"
            to="/library/home"
            className="p-0 h-[32px] w-[32px] bg-input/30 hover:bg-input/50"
          >
            <span className="icon-[mdi--home-outline] w-4 h-4"></span>
          </Nav>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('librarybar.home')}</TooltipContent>
      </Tooltip>

      {/* 收藏按钮 */}
      <Tooltip>
        <TooltipTrigger>
          <Nav
            variant="librarybar"
            to="/library/collections"
            className="p-0 h-[32px] w-[32px] bg-input/30 hover:bg-input/50"
          >
            <span className="icon-[mdi--collection] w-4 h-4"></span>
          </Nav>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('librarybar.collections')}</TooltipContent>
      </Tooltip>

      {/* 筛选器 */}
      <div className="relative pl-3">
        <Filter>
          <Button
            onClick={toggleFilterMenu}
            variant="thirdary"
            size="icon"
            className="h-[32px] w-[32px]"
          >
            <span
              className={cn(
                isEqual(filter, {})
                  ? 'icon-[mdi--filter-variant] w-4 h-4'
                  : 'icon-[mdi--filter-variant-plus] w-4 h-4'
              )}
            ></span>
          </Button>
        </Filter>
        {!isEqual(filter, {}) && (
          <Button
            className={cn(
              'absolute -top-1 -right-1 w-[14px] h-[14px] p-0 items-center justify-center'
            )}
            onClick={clearFilter}
            variant={'thirdary'}
          >
            <span className={cn('icon-[mdi--close] w-[10px] h-[10px]')}></span>
          </Button>
        )}
      </div>

      {/* 分组按钮 */}
      <Tooltip>
        <TooltipTrigger>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="thirdary" size="icon" className="h-[32px] w-[32px]">
                <span className="icon-[mdi--format-list-group] w-4 h-4"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('librarybar.groupBy')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSelectedGroup('none')}>
                  {t('librarybar.groups.none')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroup('collection')}>
                  {t('librarybar.groups.collection')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroup('metadata.developers')}>
                  {t('librarybar.groups.developers')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroup('metadata.genres')}>
                  {t('librarybar.groups.genres')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedGroup('record.playStatus')}>
                  {t('librarybar.groups.playStatus')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('librarybar.groupBy')}: {getGroupDisplayText(selectedGroup)}
        </TooltipContent>
      </Tooltip>

      {/* 排序按钮 */}
      <SortMenu isSortMenuOpen={isSortMenuOpen}>
        <Button
          onClick={toggleSortMenu}
          variant="thirdary"
          size="icon"
          className="h-[32px] w-[32px]"
        >
          <span className="icon-[mdi--sort] w-4 h-4"></span>
        </Button>
      </SortMenu>
    </div>
  )
}

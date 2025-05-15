import { Button } from '@ui/button'
import { ClearableInput } from '@ui/input'
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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { Filter } from './Filter'
import { useFilterStore } from './Filter/store'
import { GameList } from './GameList'
import { PositionButton } from './PositionButton'
import { SortMenu } from './SortMenu'
import { useLibrarybarStore } from './store'

export function Librarybar(): JSX.Element {
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

  console.warn(`[DEBUG] Librarybar`)

  return (
    <div
      className={cn('flex flex-col gap-6 bg-background/60 w-full h-full pt-[14px] relative group')}
    >
      <div className={cn('flex flex-col gap-3 p-3 pb-0')}>
        <div className={cn('flex flex-row gap-2')}>
          <div className={cn('grow')}>
            <Nav variant="librarybar" to="./home" className={cn('')}>
              <div
                className={cn(
                  'flex flex-row gap-[min(calc(100%-48px),8px)] w-full items-center justify-start'
                )}
              >
                <span className={cn('icon-[mdi--home] w-5 h-5')}></span>
                <span className={cn('whitespace-nowrap')}>{t('librarybar.home')}</span>
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
              <TooltipContent side="right">{t('librarybar.collections')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
      <div className={cn('flex flex-col gap-3 p-3 pt-0 pr-0 grow h-0 pb-0')}>
        <div className={cn('flex flex-row gap-2 pr-3')}>
          <div className={cn('grow')}>
            <Tooltip>
              <TooltipTrigger className={cn('w-full')}>
                <ClearableInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('librarybar.search.placeholder')}
                  onClear={() => setQuery('')}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('librarybar.search.tooltip')}</TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
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
            {!isEqual(filter, {}) && (
              <Button
                className={cn(
                  'absolute -top-1 -right-1 w-[14px] h-[14px] p-0 items-center justify-center'
                )}
                onClick={clearFilter}
                variant={'outline'}
              >
                <span className={cn('icon-[mdi--close] w-[10px] h-[10px]')}></span>
              </Button>
            )}
          </div>
        </div>
        <div className={cn('flex flex-row gap-2 pr-3 items-center')}>
          <div className={cn('flex-1 min-w-0')}>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="pr-3 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('librarybar.groupBy')}</SelectLabel>
                  <SelectItem value="none">{t('librarybar.groups.none')}</SelectItem>
                  <SelectItem value="collection">{t('librarybar.groups.collection')}</SelectItem>
                  <SelectItem value="metadata.developers">
                    {t('librarybar.groups.developers')}
                  </SelectItem>
                  <SelectItem value="metadata.genres">{t('librarybar.groups.genres')}</SelectItem>
                  <SelectItem value="record.playStatus">
                    {t('librarybar.groups.playStatus')}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <SortMenu isSortMenuOpen={isSortMenuOpen}>
              <Button onClick={toggleSortMenu} variant="outline" size={'icon'}>
                <span className={cn('icon-[mdi--sort] w-5 h-5')}></span>
              </Button>
            </SortMenu>
          </div>
        </div>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
      <PositionButton />
    </div>
  )
}

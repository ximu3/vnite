import { Button } from '@ui/button'
import { ClearableInput } from '@ui/input'
import { Nav } from '@ui/nav'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Separator } from '@ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { isEqual } from 'lodash'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { Filter } from './Filter'
import { useFilterStore } from './Filter/store'
import { GameList } from './GameList'
import { PositionButton } from './PositionButton'
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
  const [by, setBy] = useConfigState('game.gameList.sort.by')
  const [order, setOrder] = useConfigState('game.gameList.sort.order')
  const toggleSortMenu = (): void => {
    setIsSortMenuOpen(!isSortMenuOpen)
  }
  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }

  const [playStatusOrder, setPlayStatusOrder] = useConfigState('game.gameList.playingStatusOrder')
  const handleMoveUp = (index: number): void => {
    if (index === 0) return
    const newOrder: string[] = [...playStatusOrder]
    ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    setPlayStatusOrder([...newOrder])
  }

  const handleMoveDown = (index: number): void => {
    if (index === playStatusOrder.length - 1) return
    const newOrder: string[] = [...playStatusOrder]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setPlayStatusOrder([...newOrder])
  }

  console.warn(`[DEBUG] Librarybar`)

  return (
    <div
      className={cn(
        'flex flex-col gap-6 bg-card w-full h-full pt-2 relative group border-l border-border'
      )}
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
              <SelectTrigger className="pr-3">
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
            <Popover open={isSortMenuOpen}>
              <Tooltip>
                <PopoverTrigger>
                  <TooltipTrigger asChild>
                    <Button onClick={toggleSortMenu} variant="outline" size={'icon'}>
                      <span className={cn('icon-[mdi--sort] w-5 h-5')}></span>
                    </Button>
                  </TooltipTrigger>
                </PopoverTrigger>
                <TooltipContent side="right">{t('list.all.sortBy')}</TooltipContent>
              </Tooltip>
              <PopoverContent side="right">
                <div className={cn('flex flex-col gap-5')}>
                  <div className={cn('flex flex-row gap-1 items-center justify-center')}>
                    <div className={cn('text-sm whitespace-nowrap')}>{t('list.all.sortBy')}：</div>
                    <Select value={by} onValueChange={setBy} defaultValue="name">
                      <SelectTrigger className={cn('w-[120px] h-[26px] text-xs')}>
                        <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>{t('list.all.sortBy')}：</SelectLabel>
                          <SelectItem value="metadata.name">
                            {t('list.all.sortOptions.name')}
                          </SelectItem>
                          <SelectItem value="metadata.releaseDate">
                            {t('list.all.sortOptions.releaseDate')}
                          </SelectItem>
                          <SelectItem value="record.lastRunDate">
                            {t('list.all.sortOptions.lastRunDate')}
                          </SelectItem>
                          <SelectItem value="record.addDate">
                            {t('list.all.sortOptions.addDate')}
                          </SelectItem>
                          <SelectItem value="record.playTime">
                            {t('list.all.sortOptions.playTime')}
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={'outline'}
                      size={'icon'}
                      className={cn('h-[26px] w-[26px] ml-1')}
                      onClick={toggleOrder}
                    >
                      {order === 'asc' ? (
                        <span className={cn('icon-[mdi--arrow-up] w-4 h-4')}></span>
                      ) : (
                        <span className={cn('icon-[mdi--arrow-down] w-4 h-4')}></span>
                      )}
                    </Button>
                  </div>
                  {selectedGroup === 'record.playStatus' && (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-3">
                        {playStatusOrder.map((value, index) => (
                          <React.Fragment key={value}>
                            <div className="flex flex-col gap-1">
                              <div
                                className={cn(
                                  'flex flex-row gap-3 items-center justify-between',
                                  'ml-5 mr-5'
                                )}
                              >
                                <div className={cn('text-sm whitespace-nowrap')}>
                                  {t(`utils:game.playStatus.${value}`)}
                                </div>
                                <div className="flex flex-row gap-1">
                                  <Button
                                    variant="outline"
                                    size={'icon'}
                                    className={cn('h-[26px] w-[26px] ml-1')}
                                    disabled={index === 0}
                                    onClick={() => handleMoveUp(index)}
                                  >
                                    <span
                                      className={cn('icon-[mdi--keyboard-arrow-up] w-4 h-4')}
                                    ></span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size={'icon'}
                                    className={cn('h-[26px] w-[26px] ml-1')}
                                    disabled={index === playStatusOrder.length - 1}
                                    onClick={() => handleMoveDown(index)}
                                  >
                                    <span
                                      className={cn('icon-[mdi--keyboard-arrow-down] w-4 h-4')}
                                    ></span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <GameList query={query} selectedGroup={selectedGroup} />
      </div>
      <PositionButton />
    </div>
  )
}

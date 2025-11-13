import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Separator } from '@ui/separator'
import { Switch } from '@ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { useGameListStore, usePlayStatusOrderStore } from './store'

export function SortMenu({
  isSortMenuOpen,
  setIsSortMenuOpen,
  children
}: {
  isSortMenuOpen: boolean
  setIsSortMenuOpen: (open: boolean) => void
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [selectedGroup, setSelectedGroup] = useConfigState('game.gameList.selectedGroup')
  const [by, setBy] = useConfigState('game.gameList.sort.by')
  const [order, setOrder] = useConfigState('game.gameList.sort.order')
  const setOpenValues = useGameListStore((s) => s.setOpenValues)
  const [overrideCollectionSort, setOverrideCollectionSort] = useConfigState(
    'game.gameList.overrideCollectionSort'
  )

  const toggleOrder = (): void => {
    setOrder(order === 'asc' ? 'desc' : 'asc')
  }

  const { playStatusOrder, setPlayStatusOrder } = usePlayStatusOrderStore()
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

  return (
    <Popover open={isSortMenuOpen} onOpenChange={setIsSortMenuOpen}>
      <Tooltip>
        <PopoverTrigger>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="bottom">{t('librarybar.gameListSettings')}</TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom">
        <div className={cn('flex flex-col gap-5')}>
          {/* Sort By Select */}
          <div className={cn('flex flex-row gap-1 items-center justify-center')}>
            <div className={cn('text-sm whitespace-nowrap')}>{t('list.all.sortBy')}：</div>
            <Select value={by} onValueChange={setBy} defaultValue="name">
              <SelectTrigger className={cn('flex-grow h-[26px] text-xs min-h-0')}>
                <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="metadata.name">{t('list.all.sortOptions.name')}</SelectItem>
                  <SelectItem value="metadata.sortName">
                    {t('list.all.sortOptions.sortName')}
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
                  <SelectItem value="record.score">{t('list.all.sortOptions.score')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {/* Toggle Order Button */}
            <Button
              variant={'thirdary'}
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

          {/* Group by select */}
          <div className={cn('flex flex-row gap-1 items-center justify-center')}>
            <div className={cn('text-sm whitespace-nowrap')}>{t('librarybar.groupBy')}：</div>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className={cn('flex-grow h-[26px] text-xs min-h-0')}>
                <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('librarybar.groups.none')}</SelectItem>
                <SelectItem value="collection">{t('librarybar.groups.collection')}</SelectItem>
                <SelectItem value="metadata.developers">
                  {t('librarybar.groups.developers')}
                </SelectItem>
                <SelectItem value="metadata.genres">{t('librarybar.groups.genres')}</SelectItem>
                <SelectItem value="record.playStatus">
                  {t('librarybar.groups.playStatus')}
                </SelectItem>
              </SelectContent>
            </Select>
            {/* Quickly collapse Button */}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant={'thirdary'}
                  size={'icon'}
                  className={cn('h-[26px] w-[26px] ml-1')}
                  onClick={() => setOpenValues(selectedGroup, [])}
                >
                  <span className={cn('icon-[mdi--collapse-all-outline] w-4 h-4')}></span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('librarybar.collapseAllGroups')}</TooltipContent>
            </Tooltip>
          </div>

          {/* Play Status Order */}
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
                            <span className={cn('icon-[mdi--keyboard-arrow-up] w-4 h-4')}></span>
                          </Button>
                          <Button
                            variant="outline"
                            size={'icon'}
                            className={cn('h-[26px] w-[26px] ml-1')}
                            disabled={index === playStatusOrder.length - 1}
                            onClick={() => handleMoveDown(index)}
                          >
                            <span className={cn('icon-[mdi--keyboard-arrow-down] w-4 h-4')}></span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </>
          )}

          {/* Collection settings */}
          {selectedGroup === 'collection' && (
            <>
              <Separator />
              <div className="flex flex-row gap-5 items-center justify-between">
                <div className="text-sm whitespace-nowrap">{t('list.overrideCollectionSort')}</div>
                <Switch
                  checked={overrideCollectionSort}
                  onCheckedChange={setOverrideCollectionSort}
                />
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

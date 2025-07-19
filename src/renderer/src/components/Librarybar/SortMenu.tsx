import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'

export function SortMenu({
  isSortMenuOpen,
  children
}: {
  isSortMenuOpen: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const [by, setBy] = useConfigState('game.gameList.sort.by')
  const [order, setOrder] = useConfigState('game.gameList.sort.order')

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
  return (
    <Popover open={isSortMenuOpen}>
      <Tooltip>
        <PopoverTrigger>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="bottom">{t('list.all.sortBy')}</TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom">
        <div className={cn('flex flex-col gap-5')}>
          <div className={cn('flex flex-row gap-1 items-center justify-center')}>
            <div className={cn('text-sm whitespace-nowrap')}>{t('list.all.sortBy')}：</div>
            <Select value={by} onValueChange={setBy} defaultValue="name">
              <SelectTrigger className={cn('w-[130px] h-[26px] text-xs min-h-0')}>
                <SelectValue placeholder="Select a fruit" className={cn('text-xs')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t('list.all.sortBy')}：</SelectLabel>
                  <SelectItem value="metadata.name">{t('list.all.sortOptions.name')}</SelectItem>
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
        </div>
      </PopoverContent>
    </Popover>
  )
}

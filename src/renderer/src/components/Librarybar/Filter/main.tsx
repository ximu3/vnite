import { cn } from '~/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Button } from '@ui/button'
import { DateInput } from '~/components/ui/date-input'
import { useFilterStore } from './store'
import { FilterCombobox } from './FilterCombobox'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Separator } from '@ui/separator'

export function Filter({ children }: { children: React.ReactNode }): JSX.Element {
  const { isFilterMenuOpen, setIsFilterMenuOpen, clearFilter, filter, updateFilter, deleteFilter } =
    useFilterStore()
  return (
    <Popover open={isFilterMenuOpen}>
      <Tooltip>
        <PopoverTrigger>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="right">高级筛选</TooltipContent>
      </Tooltip>
      <PopoverContent side="right" className="h-screen w-80">
        <div className={cn('flex flex-col gap-3')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('font-bold')}>筛选器</div>
            <Button
              className={cn('non-draggable p-0 m-0 h-4 w-4 self-start hover:bg-transparent')}
              variant={'ghost'}
              onClick={() => {
                setIsFilterMenuOpen(false)
              }}
            >
              <Cross2Icon className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant={'link'}
            className={cn('self-start p-0 -mb-2 -mt-2')}
            onClick={clearFilter}
          >
            清除筛选器
          </Button>
          <Separator />
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                发行日期
              </div>
              <Button
                className={cn('p-0 -mb-2 -mt-2')}
                variant={'link'}
                onClick={() => {
                  deleteFilter('releaseDate', '#all')
                }}
              >
                清除
              </Button>
            </div>
            <div className={cn('flex flex-row gap-2 items-center justify-center')}>
              <DateInput
                value={filter?.releaseDate ? filter?.releaseDate[0] : 0}
                onChange={(e) => {
                  const newReleaseDateFilter = [
                    e.target.value,
                    filter?.releaseDate ? filter?.releaseDate[1] : '9999-12-31'
                  ]
                  updateFilter('releaseDate', newReleaseDateFilter)
                }}
              />
              -
              <DateInput
                value={filter?.releaseDate ? filter?.releaseDate[1] : 0}
                onChange={(e) => {
                  const newReleaseDateFilter = [
                    filter?.releaseDate ? filter?.releaseDate[0] : '1970-01-01',
                    e.target.value
                  ]
                  updateFilter('releaseDate', newReleaseDateFilter)
                }}
              />
            </div>
          </div>
          <Separator className={cn('mt-1')} />
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>开发商</div>
            </div>
            <FilterCombobox filed="metadata.developers" placeholder="开发商" />
          </div>
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>发行商</div>
            </div>
            <FilterCombobox filed="metadata.publishers" placeholder="发行商" />
          </div>
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>类别</div>
            </div>
            <FilterCombobox filed="metadata.genres" placeholder="类别" />
          </div>
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>平台</div>
            </div>
            <FilterCombobox filed="metadata.platforms" placeholder="平台" />
          </div>
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>标签</div>
            </div>
            <FilterCombobox filed="metadata.tags" placeholder="标签" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

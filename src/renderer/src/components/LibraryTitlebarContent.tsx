import { isEqual } from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/components/ui/button'
import { ClearableInput } from '~/components/ui/input'
import { Nav } from '~/components/ui/nav'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { cn } from '~/utils'
import { Filter } from './Librarybar/Filter'
import { useFilterStore } from './Librarybar/Filter/store'
import { SortMenu } from './Librarybar/SortMenu'
import { useLibrarybarStore } from './Librarybar/store'

export function LibraryTitlebarContent(): React.JSX.Element {
  const { t } = useTranslation('game')
  const query = useLibrarybarStore((state) => state.query)
  const setQuery = useLibrarybarStore((state) => state.setQuery)
  const filter = useFilterStore((state) => state.filter)
  const toggleFilterMenu = useFilterStore((state) => state.toggleFilterMenu)
  const clearFilter = useFilterStore((state) => state.clearFilter)

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const toggleSortMenu = (): void => {
    setIsSortMenuOpen(!isSortMenuOpen)
  }

  return (
    <div className="flex flex-row items-center justify-center gap-2">
      {/* Search Box */}
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
      {/* Home Button */}
      <Tooltip>
        <TooltipTrigger>
          <Nav variant="librarybar" to="/library/home" className="p-0 h-[32px] w-[32px]">
            <span className="icon-[mdi--home-outline] w-4 h-4"></span>
          </Nav>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('librarybar.home')}</TooltipContent>
      </Tooltip>

      {/* Collections Button */}
      <Tooltip>
        <TooltipTrigger>
          <Nav variant="librarybar" to="/library/collections" className="p-0 h-[32px] w-[32px]">
            <span className="icon-[mdi--collection] w-4 h-4"></span>
          </Nav>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('librarybar.collections')}</TooltipContent>
      </Tooltip>

      {/* Filter */}
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

      {/* Sort Button */}
      <SortMenu isSortMenuOpen={isSortMenuOpen} setIsSortMenuOpen={setIsSortMenuOpen}>
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

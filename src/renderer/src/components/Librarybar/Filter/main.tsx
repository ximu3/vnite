import { cn } from '~/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Button } from '@ui/button'
import { DateInput } from '~/components/ui/date-input'
import { useFilterStore } from './store'
import { FilterCombobox } from './FilterCombobox'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Separator } from '@ui/separator'
import { useTranslation } from 'react-i18next'
import { getAllExtraKeys } from '~/stores/game'
import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/database'

export function Filter({ children }: { children: React.ReactNode }): JSX.Element {
  const { isFilterMenuOpen, setIsFilterMenuOpen, clearFilter, filter, updateFilter, deleteFilter } =
    useFilterStore()
  const { t } = useTranslation('game')

  const extraInfoKeys = (): string[] => {
    const allKeys = getAllExtraKeys()

    // Create a reverse mapping from localized values to original keys
    const localizedToOriginal: Record<string, string> = {}

    // Map each predefined key to its localized version
    METADATA_EXTRA_PREDEFINED_KEYS.forEach((key) => {
      // Get localized version using i18next
      const localizedKey = t(`detail.overview.extraInformation.fields.${key}`)
      localizedToOriginal[localizedKey] = key
    })

    // Sort according to the order in METADATA_EXTRA_PREDEFINED_KEYS
    return allKeys.sort((a: string, b: string) => {
      // Get the original keys from localized values
      const aOriginal = localizedToOriginal[a]
      const bOriginal = localizedToOriginal[b]

      // If both are predefined keys, sort by their position in the predefined array
      if (aOriginal && bOriginal) {
        return (
          METADATA_EXTRA_PREDEFINED_KEYS.indexOf(aOriginal) -
          METADATA_EXTRA_PREDEFINED_KEYS.indexOf(bOriginal)
        )
      }

      // If only a is a predefined key, a comes first
      if (aOriginal) {
        return -1
      }

      // If only b is a predefined key, b comes first
      if (bOriginal) {
        return 1
      }

      // If neither is a predefined key, sort alphabetically
      return a.localeCompare(b)
    })
  }

  return (
    <Popover open={isFilterMenuOpen}>
      <Tooltip>
        <PopoverTrigger>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="right">{t('filter.title')}</TooltipContent>
      </Tooltip>
      <PopoverContent side="right" className="h-[calc(100vh-30px)] w-[328px] bg-popover/[0.93]">
        <div className={cn('flex flex-col h-full gap-3')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('font-bold')}>{t('filter.panel.title')}</div>
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
            {t('filter.panel.clear')}
          </Button>
          <Separator />
          <div className={cn('flex flex-col gap-1 items-start justify-start')}>
            <div className={cn('flex flex-row justify-between items-center w-full')}>
              <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                {t('filter.panel.releaseDate')}
              </div>
              <Button
                className={cn('p-0 -mb-2 -mt-2')}
                variant={'link'}
                onClick={() => {
                  deleteFilter('metadata.releaseDate', '#all')
                }}
              >
                {t('filter.panel.clearFilter')}
              </Button>
            </div>
            <div className={cn('flex flex-row gap-2 items-center justify-center')}>
              <DateInput
                value={
                  filter['metadata.releaseDate']?.length > 0 ? filter['metadata.releaseDate'][0] : 0
                }
                onChange={(e) => {
                  const newReleaseDateFilter = [
                    e.target.value,
                    filter['metadata.releaseDate']?.length > 0
                      ? filter['metadata.releaseDate'][1]
                      : '9999-12-31'
                  ]
                  updateFilter('metadata.releaseDate', newReleaseDateFilter)
                }}
              />
              -
              <DateInput
                value={
                  filter['metadata.releaseDate']?.length > 0 ? filter['metadata.releaseDate'][1] : 0
                }
                onChange={(e) => {
                  const newReleaseDateFilter = [
                    filter['metadata.releaseDate']?.length > 0
                      ? filter['metadata.releaseDate'][0]
                      : '1970-01-01',
                    e.target.value
                  ]
                  updateFilter('releaseDate', newReleaseDateFilter)
                }}
              />
            </div>
          </div>
          <Separator className={cn('mt-1')} />
          <div className={cn('h-full overflow-auto scrollbar-base-thin pr-3 -mr-3')}>
            <div className={cn('flex flex-col gap-3 ')}>
              <div className={cn('flex flex-col gap-1 items-start justify-start')}>
                <div className={cn('flex flex-row justify-between items-center w-full')}>
                  <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                    {t('filter.panel.developers')}
                  </div>
                </div>
                <FilterCombobox
                  filed="metadata.developers"
                  placeholder={t('filter.panel.developers')}
                />
              </div>
              <div className={cn('flex flex-col gap-1 items-start justify-start')}>
                <div className={cn('flex flex-row justify-between items-center w-full')}>
                  <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                    {t('filter.panel.publishers')}
                  </div>
                </div>
                <FilterCombobox
                  filed="metadata.publishers"
                  placeholder={t('filter.panel.publishers')}
                />
              </div>
              <div className={cn('flex flex-col gap-1 items-start justify-start')}>
                <div className={cn('flex flex-row justify-between items-center w-full')}>
                  <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                    {t('filter.panel.genres')}
                  </div>
                </div>
                <FilterCombobox filed="metadata.genres" placeholder={t('filter.panel.genres')} />
              </div>
              <div className={cn('flex flex-col gap-1 items-start justify-start')}>
                <div className={cn('flex flex-row justify-between items-center w-full')}>
                  <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                    {t('filter.panel.platforms')}
                  </div>
                </div>
                <FilterCombobox
                  filed="metadata.platforms"
                  placeholder={t('filter.panel.platforms')}
                />
              </div>
              <div className={cn('flex flex-col gap-1 items-start justify-start')}>
                <div className={cn('flex flex-row justify-between items-center w-full')}>
                  <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                    {t('filter.panel.tags')}
                  </div>
                </div>
                <FilterCombobox filed="metadata.tags" placeholder={t('filter.panel.tags')} />
              </div>

              {/* Extra information filtering section */}
              {extraInfoKeys().length > 0 && (
                <>
                  <Separator className={cn('mt-1')} />
                  {/* Create filter options for each extra information key */}
                  {extraInfoKeys().map((key) => (
                    <div key={key} className={cn('flex flex-col gap-1 items-start justify-start')}>
                      <div className={cn('flex flex-row justify-between items-center w-full')}>
                        <div className={cn('whitespace-nowrap text-sm text-foreground ml-[6px]')}>
                          {key}
                        </div>
                      </div>
                      <FilterCombobox filed={`metadata.extra.${key}`} placeholder={key} />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

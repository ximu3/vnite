import { Cross2Icon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { getAllValuesInKey, getAllExtraValuesForKey } from '~/stores/game'
import { cn } from '~/utils'
import { useFilterStore } from './store'
import { useTranslation } from 'react-i18next'

interface Option {
  value: string
  label: string
}

export function FilterCombobox({
  filed,
  placeholder
}: {
  filed: string
  placeholder: string
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false)
  const { filter, deleteFilter, addFilter } = useFilterStore()
  const selectedValues = filter[filed] || []

  const options: Option[] = React.useMemo(() => {
    let allValues: string[] = []

    // Check if it's an extra information field
    if (filed.startsWith('metadata.extra.')) {
      const extraKey = filed.replace('metadata.extra.', '')
      allValues = getAllExtraValuesForKey(extraKey)
      console.warn(`allValues: ${allValues} extraKey: ${extraKey}`)
    } else {
      allValues = getAllValuesInKey(filed as any)
    }

    const allOptions = allValues.map((value) => ({
      value,
      label: value
    }))

    // Sort: selected items appear first
    return allOptions.sort((a, b) => {
      const aSelected = selectedValues.includes(a.value)
      const bSelected = selectedValues.includes(b.value)

      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return a.label.localeCompare(b.label, 'zh-CN')
    })
  }, [filed, selectedValues])

  const handleSelect = (value: string): void => {
    if (selectedValues.includes(value)) {
      // If already selected, remove it
      deleteFilter(filed, value)
    } else {
      // If not selected, add it
      addFilter(filed, value)
    }
  }

  const { t } = useTranslation('game')
  return (
    <div className={cn('flex flex-row gap-2')}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between non-draggable"
          >
            {/* Display selected values */}
            <div className="flex flex-row gap-1 -ml-2 mx-1 my-1 p-0 pl-1 truncate w-[196px]">
              {selectedValues.length > 0 ? (
                selectedValues.map((value) => (
                  <span
                    key={value}
                    className="px-2 py-1 text-sm rounded-md bg-primary/[0.8] text-primary-foreground"
                  >
                    {options.find((opt) => opt.value === value)?.label || value}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">
                  {t('filter.combobox.select', { placeholder })}
                </span>
              )}
            </div>
            <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          className="w-[240px] p-0 max-w-none bg-transparent"
        >
          <Command className={cn('max-w-none bg-popover/[0.75]')}>
            {/* Search Input */}
            <CommandInput
              placeholder={t('filter.combobox.search', { placeholder })}
              className={cn('non-draggable')}
            />
            <CommandEmpty>{t('filter.combobox.notFound', { placeholder })}</CommandEmpty>
            <CommandList className={cn('scrollbar-base')}>
              <CommandGroup>
                {/* Display all values */}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        'ml-auto',
                        selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        size={'icon'}
        variant={'outline'}
        onClick={() => {
          deleteFilter(filed, '#all')
        }}
      >
        <Cross2Icon className="w-4 h-4" />
      </Button>
    </div>
  )
}

'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '~/utils'
import { Button } from '@ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Cross2Icon } from '@radix-ui/react-icons'
import { useGameIndexManager } from '~/hooks'
import { useFilterStore } from './store'

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
}): JSX.Element {
  const [open, setOpen] = React.useState(false)
  const { getAllValuesInKey } = useGameIndexManager()
  const { filter, deleteFilter, addFilter } = useFilterStore()
  const selectedValues = filter[filed] || []
  const options: Option[] = React.useMemo(() => {
    const allOptions = getAllValuesInKey(filed).map((value) => ({
      value,
      label: value
    }))

    // Sorting the options: selected ones come first
    return allOptions.sort((a, b) => {
      const aSelected = selectedValues.includes(a.value)
      const bSelected = selectedValues.includes(b.value)

      if (aSelected && !bSelected) return -1
      if (!aSelected && bSelected) return 1
      return 0
    })
  }, [getAllValuesInKey, filed, selectedValues])

  const handleSelect = (value: string): void => {
    if (selectedValues.includes(value)) {
      // Remove if checked
      deleteFilter(filed, value)
    } else {
      // If unchecked, add
      addFilter(filed, value)
    }
  }
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
            <div className="flex flex-row gap-1 -ml-2 mx-1 my-1 p-0 truncate w-[196px]">
              {selectedValues.length > 0 ? (
                selectedValues.map((value) => (
                  <span
                    key={value}
                    className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm"
                  >
                    {options.find((opt) => opt.value === value)?.label}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground">{`选择${placeholder}`}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-[240px] p-0 max-w-none">
          <Command className={cn(' max-w-none')}>
            <CommandInput placeholder={`搜索${placeholder}`} className={cn('non-draggable')} />
            <CommandEmpty>{`未找到此${placeholder}`}</CommandEmpty>
            <CommandList className={cn('scrollbar-base')}>
              <CommandGroup>
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
        <Cross2Icon className="h-4 w-4" />
      </Button>
    </div>
  )
}

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
import { ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '~/utils'

export function PresetSelecter({
  className,
  onSelectPreset
}: {
  className?: string
  onSelectPreset: (preset: string) => void
}): React.JSX.Element {
  const { t } = useTranslation('config')
  const [open, setOpen] = React.useState(false)

  const presets = [
    {
      value: 'default',
      label: t('advanced.randomGameRule.presets.default'),
      rules: `{
  "gameNameNot": ["game name"]
}`
    },
    {
      value: 'filterPlayStatus',
      label: t('advanced.randomGameRule.presets.filterPlayStatus'),
      rules: `{
  "and": [
    {
      "playStatusIs": ["playing", "unplayed", "finished", "partial", "multiple", "shelved"]
    },
    {
      "gameNameNot": ["game name"]
    }
  ]
}`
    },
    {
      value: 'filterCollection',
      label: t('advanced.randomGameRule.presets.filterCollection'),
      rules: `{
  "and": [
    {
      "inCollection": ["collection name"]
    },
    {
      "gameNameNot": ["game name"]
    }
  ]
}`
    }
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(className)} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=" justify-between items-center flex flex-row"
        >
          {t('advanced.randomGameRule.preset')}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder={t('advanced.randomGameRule.search')} />
          <CommandList>
            <CommandEmpty>{t('advanced.randomGameRule.noPresetFound')}</CommandEmpty>
            <CommandGroup>
              {presets.map((preset) => (
                <CommandItem
                  key={preset.value}
                  value={preset.value}
                  onSelect={() => {
                    onSelectPreset(preset.rules)
                    setOpen(false)
                  }}
                  className={cn('pl-5')}
                >
                  {preset.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

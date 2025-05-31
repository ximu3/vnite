import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'
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
import { toast } from 'sonner'
import { useTheme } from '~/components/ThemeProvider'
import { useTranslation } from 'react-i18next'

export function PresetSelecter({
  className,
  setCssContent
}: {
  className?: string
  setCssContent: (theme: string) => void
}): JSX.Element {
  const { t } = useTranslation('config')
  const [open, setOpen] = React.useState(false)
  const [value] = React.useState('')
  const { updateTheme } = useTheme()

  const presets = [
    {
      value: 'default',
      label: t('theme.presets.default')
    },
    {
      value: 'mutsumi',
      label: t('theme.presets.mutsumi')
    },
    {
      value: 'moonlight',
      label: t('theme.presets.moonlight')
    }
  ]

  async function setPreset(presetName: string): Promise<void> {
    toast.promise(
      async () => {
        const theme = await window.api.theme.themePreset(presetName)
        setCssContent(theme)
        updateTheme(theme)
      },
      {
        loading: t('theme.notifications.configuring'),
        success: t('theme.notifications.configured'),
        error: (error) => `${error}`
      }
    )
  }
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={cn(className)} asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[150px] justify-between items-center flex flex-row"
          >
            {value
              ? presets.find((preset) => preset.value === value)?.label
              : t('theme.presetThemes')}
            <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[150px] p-0">
          <Command>
            <CommandInput placeholder={t('theme.searchTheme')} />
            <CommandList>
              <CommandEmpty>{t('theme.noPresetFound')}</CommandEmpty>
              <CommandGroup>
                {presets.map((preset) => (
                  <CommandItem
                    key={preset.value}
                    value={preset.value}
                    onSelect={(currentValue) => {
                      setPreset(currentValue)
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
    </>
  )
}

'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'

import { cn, ipcInvoke } from '~/utils'
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

const presets = [
  {
    value: 'default',
    label: '默认'
  },
  {
    value: 'mutsumi',
    label: 'Mutsumi'
  }
]

export function PresetSelecter({
  className,
  setCssContent
}: {
  className?: string
  setCssContent: (theme: string) => void
}): JSX.Element {
  const [open, setOpen] = React.useState(false)
  const [value] = React.useState('')
  const { updateTheme } = useTheme()

  async function setPreset(presetName: string): Promise<void> {
    toast.promise(
      async () => {
        const theme = (await ipcInvoke('theme-preset', presetName)) as string
        setCssContent(theme)
        updateTheme(theme)
      },
      {
        loading: '正在配置主题...',
        success: '主题配置成功',
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
            className="w-[150px] justify-between"
          >
            {value ? presets.find((preset) => preset.value === value)?.label : '预设主题'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[150px] p-0">
          <Command>
            <CommandInput placeholder="搜索主题" />
            <CommandList>
              <CommandEmpty>No preset found.</CommandEmpty>
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

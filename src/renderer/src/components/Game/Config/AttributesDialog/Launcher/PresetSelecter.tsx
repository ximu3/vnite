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
import { useDBSyncedState } from '~/hooks'

import { useSteamIdDialogStore, SteamIdDialog } from './SteamIdDialog'

const presets = [
  {
    value: 'default',
    label: '默认配置'
  },
  {
    value: 'le',
    label: 'LE转区启动'
  },
  {
    value: 'steam',
    label: 'Steam启动'
  },
  {
    value: 'vba',
    label: 'VBA启动'
  }
]

export function PresetSelecter({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const [open, setOpen] = React.useState(false)
  const [steamId] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['steamId'])
  const [value] = React.useState('')
  const { setIsOpen, setGameId } = useSteamIdDialogStore()

  async function setPreset(presetName: string, gameId: string): Promise<void> {
    if (presetName === 'steam') {
      if (steamId) {
        toast.promise(
          async () => {
            await ipcInvoke('launcher-preset', 'steam', gameId, steamId)
          },
          {
            loading: '正在配置预设...',
            success: '预设配置成功',
            error: (error) => `${error}`
          }
        )
        return
      }
      setIsOpen(true)
      setGameId(gameId)
      toast.info('请输入Steam ID')
      return
    }
    toast.promise(
      async () => {
        await ipcInvoke('launcher-preset', presetName, gameId)
      },
      {
        loading: '正在配置预设...',
        success: '预设配置成功',
        error: (error) => `${error}`
      }
    )
  }
  return (
    <>
      <SteamIdDialog />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className={cn(className)} asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[150px] justify-between"
          >
            {value ? presets.find((preset) => preset.value === value)?.label : '预设配置'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[150px] p-0">
          <Command>
            <CommandInput placeholder="搜索配置" />
            <CommandList>
              <CommandEmpty>No preset found.</CommandEmpty>
              <CommandGroup>
                {presets.map((preset) => (
                  <CommandItem
                    key={preset.value}
                    value={preset.value}
                    onSelect={(currentValue) => {
                      setPreset(currentValue, gameId)
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

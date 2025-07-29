'use client'

import * as React from 'react'
import { ChevronsUpDown } from 'lucide-react'

import { cn } from '~/utils'
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
import { toast } from 'sonner'
import { useGameState } from '~/hooks'

import { useSteamIdDialogStore, SteamIdDialog } from './SteamIdDialog'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

export function PresetSelecter({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [open, setOpen] = React.useState(false)
  const [steamId] = useGameState(gameId, 'metadata.steamId')
  const [value] = React.useState('')
  const { setIsOpen, setGameId } = useSteamIdDialogStore()

  const presets = [
    {
      value: 'default',
      label: t('detail.properties.launcher.preset.default')
    },
    {
      value: 'le',
      label: t('detail.properties.launcher.preset.le')
    },
    {
      value: 'steam',
      label: t('detail.properties.launcher.preset.steam')
    },
    {
      value: 'vba',
      label: t('detail.properties.launcher.preset.vba')
    }
  ]

  async function setPreset(presetName: string, gameId: string): Promise<void> {
    if (presetName === 'steam') {
      // Steam ID is required for this preset
      if (steamId) {
        toast.promise(
          async () => {
            await ipcManager.invoke('launcher:select-preset', presetName, gameId, steamId)
          },
          {
            loading: t('detail.properties.launcher.preset.notifications.configuring'),
            success: t('detail.properties.launcher.preset.notifications.success'),
            error: (error) => `${error}`
          }
        )
        return
      }
      setIsOpen(true)
      setGameId(gameId)
      toast.info(t('detail.properties.launcher.preset.steamIdRequired'))
      return
    }
    toast.promise(
      async () => {
        await ipcManager.invoke('launcher:select-preset', presetName, gameId)
      },
      {
        loading: t('detail.properties.launcher.preset.notifications.configuring'),
        success: t('detail.properties.launcher.preset.notifications.success'),
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
            className="min-w-[180px] justify-between"
          >
            {value
              ? presets.find((preset) => preset.value === value)?.label
              : t('detail.properties.launcher.preset.title')}
            <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[200px] p-0">
          <Command>
            <CommandInput placeholder={t('detail.properties.launcher.preset.search')} />
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

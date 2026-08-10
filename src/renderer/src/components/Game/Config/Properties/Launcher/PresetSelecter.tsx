'use client'

import { BUILT_IN_LAUNCHER_PRESET_IDS } from '@appTypes/models'
import { useRouter } from '@tanstack/react-router'
import { ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState } from '~/hooks'
import { useConfigTabStore } from '~/pages/Config/store'
import { cn } from '~/utils'
import { SteamIdDialog, useSteamIdDialogStore } from './SteamIdDialog'

export function PresetSelecter({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [customPresets] = useConfigLocalState('game.launcher.presets')
  const openSteamIdDialog = useSteamIdDialogStore((state) => state.openDialog)
  const setLastConfigTab = useConfigTabStore((state) => state.setLastConfigTab)

  async function applyPreset(presetId: string): Promise<void> {
    const toastId = toast.loading(t('detail.properties.launcher.preset.notifications.configuring'))
    try {
      const result = await ipcManager.invoke('launcher:select-preset', presetId, gameId)
      if (result.status === 'missing-steam-id') {
        toast.dismiss(toastId)
        openSteamIdDialog(gameId, presetId)
        toast.info(t('detail.properties.launcher.preset.steamIdRequired'))
        return
      }
      toast.success(t('detail.properties.launcher.preset.notifications.success'), { id: toastId })
    } catch (error) {
      toast.error(String(error), { id: toastId })
    }
  }

  function openManagePage(): void {
    setLastConfigTab('advanced')
    void router.navigate({ to: '/config' })
    setOpen(false)
  }

  return (
    <>
      <SteamIdDialog />
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger className={cn(className)} asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[180px] justify-between"
          >
            {t('detail.properties.launcher.preset.title')}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="max-w-[200px] p-0">
          <Command>
            <CommandInput placeholder={t('detail.properties.launcher.preset.search')} />
            <CommandList className="scrollbar-base-thin">
              <CommandEmpty>{t('detail.properties.launcher.preset.noResults')}</CommandEmpty>
              <CommandGroup>
                {BUILT_IN_LAUNCHER_PRESET_IDS.map((presetId) => (
                  <CommandItem
                    key={presetId}
                    value={presetId}
                    keywords={[t(`detail.properties.launcher.preset.${presetId}`)]}
                    onSelect={() => {
                      void applyPreset(presetId)
                      setOpen(false)
                    }}
                  >
                    {t(`detail.properties.launcher.preset.${presetId}`)}
                  </CommandItem>
                ))}
                {customPresets.map((preset) => (
                  <CommandItem
                    key={preset.id}
                    value={preset.id}
                    keywords={[preset.name]}
                    onSelect={() => {
                      void applyPreset(preset.id)
                      setOpen(false)
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{preset.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem value="manage-launcher-presets" onSelect={openManagePage}>
                  <span className="icon-[mdi--cog-outline] h-4 w-4"></span>
                  {t('detail.properties.launcher.preset.manage')}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

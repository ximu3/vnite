import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { create } from 'zustand'

import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@ui/dialog'
import { Input } from '@ui/input'
import { ipcManager } from '~/app/ipc'
import { getGameStore } from '~/stores/game'
import { cn } from '~/utils'

interface SteamIdState {
  isOpen: boolean
  steamId: string
  gameId: string
  presetId: string
  setIsOpen: (open: boolean) => void
  setSteamId: (steamId: string) => void
  openDialog: (gameId: string, presetId: string) => void
  reset: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSteamIdDialogStore = create<SteamIdState>((set) => ({
  isOpen: false,
  steamId: '',
  gameId: '',
  presetId: '',
  setIsOpen: (open): void => set({ isOpen: open }),
  setSteamId: (steamId): void => set({ steamId }),
  openDialog: (gameId, presetId): void => set({ isOpen: true, gameId, presetId, steamId: '' }),
  reset: (): void => set({ isOpen: false, gameId: '', presetId: '', steamId: '' })
}))

export function SteamIdDialog(): React.JSX.Element {
  const { t } = useTranslation('game')
  const { isOpen, setIsOpen, steamId, setSteamId, gameId, presetId, reset } =
    useSteamIdDialogStore()

  async function handleConfirm(): Promise<void> {
    const normalizedSteamId = steamId.trim()
    if (!/^\d+$/.test(normalizedSteamId)) {
      toast.error(t('detail.properties.launcher.preset.invalidSteamId'))
      return
    }

    const toastId = toast.loading(t('detail.properties.launcher.preset.notifications.configuring'))
    try {
      await getGameStore(gameId).getState().setValue('metadata.steamId', normalizedSteamId)
      const result = await ipcManager.invoke('launcher:select-preset', presetId, gameId)
      if (result.status !== 'applied') {
        throw new Error(t('detail.properties.launcher.preset.steamIdRequired'))
      }
      toast.success(t('detail.properties.launcher.preset.notifications.success'), { id: toastId })
      reset()
    } catch (error) {
      toast.error(String(error), { id: toastId })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('detail.properties.launcher.preset.steamIdTitle')}</DialogTitle>
          <DialogDescription>
            {t('detail.properties.launcher.preset.steamIdDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className={cn('flex flex-row gap-2')}>
          <Input
            value={steamId}
            inputMode="numeric"
            onChange={(event) => setSteamId(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleConfirm()
            }}
          />
          <Button onClick={() => void handleConfirm()}>{t('utils:common.confirm')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

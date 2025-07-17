import { cn } from '~/utils'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { create } from 'zustand'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

interface SteamIdState {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  steamId: string
  setSteamId: (steamId: string) => void
  gameId: string
  setGameId: (gameId: string) => void
}

// eslint-disable-next-line
export const useSteamIdDialogStore = create<SteamIdState>((set) => ({
  isOpen: false,
  setIsOpen: (open: boolean): void => set({ isOpen: open }),
  steamId: '',
  setSteamId: (steamId: string): void => set({ steamId }),
  gameId: '',
  setGameId: (gameId: string): void => set({ gameId })
}))

export function SteamIdDialog(): React.JSX.Element {
  const { t } = useTranslation('game')
  const { isOpen, setIsOpen, steamId, setSteamId, gameId, setGameId } = useSteamIdDialogStore()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent showCloseButton={false} className="w-[500px]">
        <div className={cn('flex flex-row gap-2')}>
          <Input
            value={steamId}
            onChange={(e) => {
              setSteamId(e.target.value)
            }}
          />
          <Button
            onClick={async () => {
              setIsOpen(false)
              toast.promise(
                async () => {
                  await ipcManager.invoke('launcher:select-preset', 'steam', gameId, steamId)
                },
                {
                  loading: t('detail.properties.launcher.preset.notifications.configuring'),
                  success: t('detail.properties.launcher.preset.notifications.success'),
                  error: (error) => `${error}`
                }
              )
              setSteamId('')
              setGameId('')
            }}
          >
            {t('utils:common.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

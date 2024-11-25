import { cn } from '~/utils'
import { Button } from '@ui/button'
import { Dialog, DialogContent } from '@ui/dialog'
import { Input } from '@ui/input'
import { create } from 'zustand'
import { ipcSend } from '~/utils'

interface SteamIdState {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  steamId: string
  setSteamId: (steamId: string) => void
  gameId: string
  setGameId: (gameId: string) => void
}

export const useSteamIdDialogStore = create<SteamIdState>((set) => ({
  isOpen: false,
  setIsOpen: (open: boolean): void => set({ isOpen: open }),
  steamId: '',
  setSteamId: (steamId: string): void => set({ steamId }),
  gameId: '',
  setGameId: (gameId: string): void => set({ gameId })
}))

export function SteamIdDialog(): JSX.Element {
  const { isOpen, setIsOpen, steamId, setSteamId, gameId, setGameId } = useSteamIdDialogStore()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent showCloseButton={false}>
        <div className={cn('flex flex-row gap-2')}>
          <Input
            value={steamId}
            onChange={(e) => {
              setSteamId(e.target.value)
            }}
          />
          <Button
            onClick={() => {
              setIsOpen(false)
              ipcSend('launcher-preset', 'steam', gameId, steamId)
              setSteamId('')
              setGameId('')
            }}
          >
            确定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

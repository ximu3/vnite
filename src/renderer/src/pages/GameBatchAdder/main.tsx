import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { toast } from 'sonner'

import { useGameBatchAdderStore } from './store'
import { GameList } from './GameList'

export function GameBatchAdder(): JSX.Element {
  const {
    isOpen,
    isLoading,
    actions: { setIsOpen, setGames, setIsLoading }
  } = useGameBatchAdderStore()

  const handleClose = (): void => {
    if (isLoading) {
      toast.warning('请等待游戏添加完成')
      return
    }

    setIsOpen(false)
    setGames([]) // 使用新的 actions
    setIsLoading(false)
  }
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className={cn('w-auto h-auto max-w-none flex flex-col gap-5')}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
        onClose={handleClose}
      >
        <GameList />
      </DialogContent>
    </Dialog>
  )
}

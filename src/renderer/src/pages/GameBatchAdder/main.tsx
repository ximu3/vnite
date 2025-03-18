import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { toast } from 'sonner'
import { useGameBatchAdderStore } from './store'
import { GameList } from './GameList'
import { useTranslation } from 'react-i18next'

export function GameBatchAdder(): JSX.Element {
  const { t } = useTranslation('adder')
  const {
    isOpen,
    isLoading,
    actions: { setIsOpen, setGames, setIsLoading }
  } = useGameBatchAdderStore()

  const handleClose = (): void => {
    if (isLoading) {
      toast.warning(t('gameBatchAdder.dialog.waitForCompletion'))
      return
    }

    setIsOpen(false)
    setGames([])
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

import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { toast } from 'sonner'
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useGameBatchAdderStore } from './store'
import { GameList } from './GameList'

function GameBatchAdderContent(): JSX.Element {
  const { isOpen, setIsOpen, isLoading, setGameList, setIsLoading } = useGameBatchAdderStore()
  const navigate = useNavigate()
  function handleClose(): void {
    if (isLoading) {
      toast.warning('请等待游戏添加完成')
      return
    }
    setIsOpen(false)
    setGameList([])
    setIsLoading(false)
    navigate('/')
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
        <Routes>
          <Route index element={<Navigate to={'games'} />} />
          <Route path="/games" element={<GameList />} />
        </Routes>
      </DialogContent>
    </Dialog>
  )
}

export function GameBatchAdder(): JSX.Element {
  return (
    <MemoryRouter>
      <GameBatchAdderContent />
    </MemoryRouter>
  )
}

import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useGameAdderStore } from './store'
import { GameList } from './GameList'
import { Search } from './Search'
import { ScreenshotList } from './ScreenshotList'

function GameAdderContent(): JSX.Element {
  const { isOpen, handleClose } = useGameAdderStore()
  const navigate = useNavigate()
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className={cn('w-auto h-auto max-w-none flex flex-col gap-5 outline-none')}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
        onClose={() => {
          handleClose()
          navigate('/')
        }}
      >
        <Routes>
          <Route index element={<Navigate to={'search'} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/games" element={<GameList />} />
          <Route path="/screenshots" element={<ScreenshotList />} />
        </Routes>
      </DialogContent>
    </Dialog>
  )
}

export function GameAdder(): JSX.Element {
  return (
    <MemoryRouter>
      <GameAdderContent />
    </MemoryRouter>
  )
}

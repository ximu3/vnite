import { cn } from '~/utils'
import { Dialog, DialogContent } from '@ui/dialog'
import { toast } from 'sonner'
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useGameAdderStore } from './store'
import { List } from './GameList'
import { Search } from './Search'
import { ScreenshotList } from './ScreenshotList'

function GameAdderContent(): JSX.Element {
  const {
    isOpen,
    setIsOpen,
    isLoading,
    setDataSource,
    setDbId,
    setId,
    setName,
    setScreenshotList,
    setScreenshotUrl,
    setGameList,
    setIsLoading
  } = useGameAdderStore()
  const navigate = useNavigate()
  function handleClose(): void {
    if (isLoading) {
      toast.warning('请等待游戏添加完成')
      return
    }
    setIsOpen(false)
    setDataSource('vndb')
    setDbId('')
    setId('')
    setName('')
    setScreenshotList([])
    setScreenshotUrl('')
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
          <Route index element={<Navigate to={'search'} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/games" element={<List />} />
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

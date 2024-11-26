import { Toaster } from '@ui/sonner'
import { Titlebar } from './components/Titlebar'
import { Main } from './pages/Main'
import { GameAdder } from './pages/GameAdder'
import { GameBatchAdder } from './pages/GameBatchAdder'
import { UpdateDialog } from './pages/Updater'
import { useUpdaterStore } from './pages/Updater/store'
import { useEffect } from 'react'
import { ipcOnUnique } from './utils'
import { ThemeProvider } from './components/ThemeProvider'

function App(): JSX.Element {
  const { setIsOpen: setIsUpdateDialogOpen } = useUpdaterStore()
  useEffect(() => {
    const removeUpdateAvailableListener = ipcOnUnique('update-available', (_event, _updateInfo) => {
      setIsUpdateDialogOpen(true)
    })
    return (): void => {
      removeUpdateAvailableListener()
    }
  }, [setIsUpdateDialogOpen])
  return (
    <ThemeProvider>
      <Titlebar />
      <Main />
      <GameAdder />
      <GameBatchAdder />
      <Toaster />
      <UpdateDialog />
    </ThemeProvider>
  )
}

export default App

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
import { HashRouter } from 'react-router-dom'
import { initializeStore, DataSource, useGameAdderStore } from './pages/GameAdder/store'
import { useDBSyncedState, useGameIndexManager } from './hooks'
import { Importer } from './pages/Importer'

function App(): JSX.Element {
  const { setIsOpen: setIsUpdateDialogOpen } = useUpdaterStore()
  const [defaultDataSource] = useDBSyncedState<DataSource>('steam', 'config.json', [
    'scraper',
    'defaultDataSource'
  ])
  const { gameIndex: _ } = useGameIndexManager()
  const { isOpen: isGameAdderDialogOpen } = useGameAdderStore()
  useEffect(() => {
    const removeUpdateAvailableListener = ipcOnUnique('update-available', (_event, _updateInfo) => {
      setIsUpdateDialogOpen(true)
    })
    return (): void => {
      removeUpdateAvailableListener()
    }
  }, [setIsUpdateDialogOpen])
  useEffect(() => {
    const initStore = async (): Promise<void> => {
      initializeStore(defaultDataSource)
    }
    initStore()
  }, [defaultDataSource, isGameAdderDialogOpen])
  return (
    <ThemeProvider>
      <Titlebar />
      <HashRouter>
        <Main />
      </HashRouter>
      <GameAdder />
      <GameBatchAdder />
      <Toaster />
      <UpdateDialog />
      <Importer />
    </ThemeProvider>
  )
}

export default App

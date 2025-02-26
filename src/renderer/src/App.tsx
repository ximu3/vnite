import { Toaster } from '@ui/sonner'
import { Titlebar } from './components/Titlebar'
import { Main } from './pages/Main'
import { GameAdder } from './pages/GameAdder'
import { GameBatchAdder } from './pages/GameBatchAdder'
import { UpdateDialog } from './pages/Updater'
import { useUpdaterStore } from './pages/Updater/store'
import { HashRouter } from 'react-router-dom'
import { initializeStore, useGameAdderStore } from './pages/GameAdder/store'
import { Importer } from './pages/Importer'
import { useConfigState } from './hooks'
import { setupDBSync } from './stores/sync'
import { useEffect } from 'react'
import { ipcOnUnique } from '~/utils'

function App(): JSX.Element {
  const { setIsOpen: setIsUpdateDialogOpen } = useUpdaterStore()
  const { isOpen: isGameAdderDialogOpen } = useGameAdderStore()
  const [defaultDataSource] = useConfigState('game.scraper.defaultDatasSource')
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
  useEffect(() => {
    setupDBSync()
  }, [])
  return (
    <>
      <Titlebar />
      <HashRouter>
        <Main />
      </HashRouter>
      <GameAdder />
      <GameBatchAdder />
      <Toaster />
      <UpdateDialog />
      <Importer />
    </>
  )
}

export default App

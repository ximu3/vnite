import { Toaster } from '@ui/sonner'
import { Titlebar } from './components/Titlebar'
import { Main } from './pages/Main'
import { GameAdder } from './pages/GameAdder'
import { GameBatchAdder } from './pages/GameBatchAdder'
import { UpdateDialog } from './pages/Updater'
import { HashRouter } from 'react-router-dom'
import { Importer } from './pages/Importer'
import { Setup } from './Setup'

function App(): JSX.Element {
  console.warn('[DEBUG] app.tsx')
  return (
    <>
      <Titlebar />
      <HashRouter>
        <Setup />
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

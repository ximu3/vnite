import { Toaster } from '@ui/sonner'
import { Titlebar } from './components/Titlebar'
import { Main } from './pages/Main'
import { GameAdder } from './pages/GameAdder'
import { GameBatchAdder } from './pages/GameBatchAdder'

function App(): JSX.Element {
  return (
    <>
      <Titlebar />
      <Main />
      <GameAdder />
      <GameBatchAdder />
      <Toaster />
    </>
  )
}

export default App

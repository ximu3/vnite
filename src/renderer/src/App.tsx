import { Toaster } from '@ui/sonner'
import { Titlebar } from './components/Titlebar'
import { Main } from './pages/Main'
import { GameAdder } from './pages/GameAdder'

function App(): JSX.Element {
  return (
    <>
      <Titlebar />
      <Main />
      <GameAdder />
      <Toaster />
    </>
  )
}

export default App

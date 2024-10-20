import { Toaster } from '@ui/sonner'
import { Titlebar } from './components/Titlebar'
import { Main } from './pages/Main'

function App(): JSX.Element {
  return (
    <>
      <Titlebar />
      <Main />
      <Toaster />
    </>
  )
}

export default App

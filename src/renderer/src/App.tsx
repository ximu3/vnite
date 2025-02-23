import { useDBSyncedState } from './hooks/useDBSync'
import { Input } from '@ui/input'

function App(): JSX.Element {
  const [value, setValue] = useDBSyncedState('', 'game', 'test', ['name'])
  return (
    <>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
    </>
  )
}

export default App

import { Input } from '@ui/input'
import { useDBSyncedState } from '~/utils'

function App(): JSX.Element {
  const [greeting, setGreeting] = useDBSyncedState('hello world', 'games', ['greeting'])

  return (
    <>
      <div className="flex flex-col gap-3 items-center justify-center w-screen h-screen">
        <div>
          <Input
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="hello world"
          />
          <Test />
        </div>
      </div>
    </>
  )
}

function Test(): JSX.Element {
  const [greeting] = useDBSyncedState('hello world', 'games', ['greeting'])
  return (
    <>
      <div>
        <div>{greeting}</div>
      </div>
    </>
  )
}

export default App

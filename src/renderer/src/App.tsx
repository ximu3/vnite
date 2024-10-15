import { Input, Toaster } from '@ui'
import { useDBSyncedState } from '~/utils'
import { toast } from 'sonner'

function App(): JSX.Element {
  const [test, setTest] = useDBSyncedState('hello world', 'games/metadata', ['test3', 'test1'])
  const [test2, setTest2] = useDBSyncedState('hello world', 'games/metadata', ['test2'])

  return (
    <>
      <div className="flex flex-col gap-3 items-center justify-center w-screen h-screen">
        <div>
          <Input value={test} onChange={(e) => setTest(e.target.value)} placeholder="test1" />
          <Input value={test2} onChange={(e) => setTest2(e.target.value)} placeholder="test2" />
          <button onClick={() => toast.success('test')}>toast</button>
          <Test />
        </div>
        <Toaster richColors />
      </div>
    </>
  )
}

function Test(): JSX.Element {
  const [test] = useDBSyncedState('hello world', 'games/metadata', ['test3', 'test1'])
  const [test2] = useDBSyncedState('hello world', 'games/metadata', ['test2'])
  return (
    <>
      <div className="flex flex-col gap-2">
        <div>{test}</div>
        <div>{test2}</div>
      </div>
    </>
  )
}

export default App

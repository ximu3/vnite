import { Input } from '@ui/input'
import { useState, useEffect } from 'react'
import { useGameStore, initStores } from './stores'

function App(): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const { greeting, setGreeting } = useGameStore()
  useEffect(() => {
    async function init(): Promise<void> {
      await initStores()
      setIsLoading(false)
    }
    init()
  }, [])
  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex items-center justify-center w-screen h-screen">
          <div>
            <Input
              value={greeting}
              onChange={(e) => {
                setGreeting(e.target.value)
              }}
              placeholder="hello world"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default App

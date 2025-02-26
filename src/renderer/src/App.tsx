import { useConfigLocalState, useGameState } from './hooks'
import { setupDBSync } from './stores/sync'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { GameImage } from '@ui/game-image'
import { useEffect } from 'react'
import { ipcInvoke } from '~/utils'

function App(): JSX.Element {
  const [value, setValue] = useConfigLocalState('game.linkage.localeEmulator.path')
  const [name, setName] = useGameState('tets', 'metadata.name')

  async function handleFileSelect(type: string): Promise<void> {
    try {
      const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      if (!filePath) return
      await ipcInvoke('set-game-image', 'tets', type, filePath)
      return
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    setupDBSync()
  }, [])
  return (
    <>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Input value={name} onChange={(e) => setName(e.target.value)} />
      <Button onClick={() => handleFileSelect('background')}>Select Icon</Button>
      <GameImage gameId="tets" type="background" />
    </>
  )
}

export default App

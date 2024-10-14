import { create } from 'zustand'

interface GameStore {
  greeting: string
  setGreeting: (greeting: string) => Promise<void>
}

export const useGameStore = create<GameStore>((set) => ({
  greeting: '',
  setGreeting: async (greeting: string): Promise<void> => {
    set({ greeting })
    await window.electron.ipcRenderer.invoke('setDBValue', 'game', ['greeting'], greeting)
  }
}))

export async function initGameStore(): Promise<void> {
  const greeting: string = await window.electron.ipcRenderer.invoke(
    'getDBValue',
    'game',
    ['greeting'],
    'hello'
  )
  useGameStore.setState({ greeting })
}

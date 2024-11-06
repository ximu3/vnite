import { create } from 'zustand'

interface RunningGamesState {
  runningGames: string[]
  setRunningGames: (value: string[]) => void
}

export const useRunningGames = create<RunningGamesState>((set) => ({
  runningGames: [],
  setRunningGames: (runningGames): void => set({ runningGames })
}))

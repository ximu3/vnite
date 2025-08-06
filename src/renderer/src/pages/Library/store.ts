import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface RunningGamesState {
  runningGames: string[]
  setRunningGames: (value: string[]) => void
}

export const useRunningGames = create<RunningGamesState>((set) => ({
  runningGames: [],
  setRunningGames: (runningGames): void => {
    set({ runningGames })
  }
}))

interface LibraryState {
  libraryBarWidth: number
  setLibraryBarWidth: (width: number) => void
  resetLibraryBarWidth: () => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      libraryBarWidth: 270, // default width, in px
      setLibraryBarWidth: (width: number) => set({ libraryBarWidth: width }),
      resetLibraryBarWidth: () => set({ libraryBarWidth: 270 })
    }),
    {
      name: 'library-store', // local storage key
      partialize: (state) => ({ libraryBarWidth: state.libraryBarWidth })
    }
  )
)

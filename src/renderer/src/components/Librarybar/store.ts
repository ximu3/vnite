import { create } from 'zustand'

interface LibrarybarStore {
  query: string
  setQuery: (query: string) => void
  refreshGameList: () => void
}

export const useLibrarybarStore = create<LibrarybarStore>((set) => ({
  query: '',
  setQuery: (query: string): void => set({ query }),
  refreshGameList: (): void => {
    set({ query: '-1' })
    setTimeout(() => set({ query: '' }), 1)
  }
}))

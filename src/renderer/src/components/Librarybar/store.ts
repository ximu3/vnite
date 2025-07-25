import { create } from 'zustand'
import { debounce } from 'lodash'

interface LibrarybarStore {
  query: string
  setQuery: (query: string) => void
  refreshGameList: () => void
}

export const useLibrarybarStore = create<LibrarybarStore>((set) => {
  const debouncedRefresh = debounce(() => {
    set({ query: '-1' })
    setTimeout(() => set({ query: '' }), 1)
  }, 300)

  return {
    query: '',
    setQuery: (query: string): void => set({ query }),
    refreshGameList: (): void => debouncedRefresh()
  }
})

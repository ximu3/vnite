import { debounce } from 'lodash'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

type GameListAccordionStates = Record<
  string, // Accordion key
  string[] // open AccordionItem keys
>

interface GameListStore {
  accordionStates: GameListAccordionStates
  getOpenValues: (groupKey: string) => string[]
  setOpenValues: (groupKey: string, values: string[]) => void

  openItem: (groupKey: string, itemKey: string) => void
  closeItem: (groupKey: string, itemKey: string) => void
  toggleItem: (groupKey: string, itemKey: string) => void
}

export const useGameListStore = create<GameListStore>()(
  persist(
    (set, get) => ({
      accordionStates: {},

      getOpenValues: (groupKey) => {
        if (!(groupKey in get().accordionStates)) {
          const empty_v: string[] = []
          set((state) => ({ accordionStates: { ...state.accordionStates, [groupKey]: empty_v } }))
          return empty_v
        }
        return get().accordionStates[groupKey]
      },

      setOpenValues: (groupKey, values) =>
        set((state) => ({
          accordionStates: {
            ...state.accordionStates,
            [groupKey]: values
          }
        })),

      openItem: (groupKey, itemKey) =>
        set((state) => ({
          accordionStates: {
            ...state.accordionStates,
            [groupKey]: Array.from(new Set([...(state.accordionStates[groupKey] || []), itemKey]))
          }
        })),

      closeItem: (groupKey, itemKey) =>
        set((state) => ({
          accordionStates: {
            ...state.accordionStates,
            [groupKey]: (state.accordionStates[groupKey] || []).filter((key) => key !== itemKey)
          }
        })),

      toggleItem: (groupKey, itemKey) =>
        set((state) => {
          const current = state.accordionStates[groupKey] || []
          const newList = current.includes(itemKey)
            ? current.filter((k) => k !== itemKey)
            : [...current, itemKey]

          return {
            accordionStates: {
              ...state.accordionStates,
              [groupKey]: newList
            }
          }
        })
    }),
    { name: 'game-list-accordion-state' }
  )
)

import { create } from 'zustand'

interface GameBatchEditorStore {
  // core state
  selectedGamesMap: Record<string, boolean>
  isBatchMode: boolean
  lastSelectedId: string | null

  // Operating Methods
  selectGame: (gameId: string) => void
  unselectGame: (gameId: string) => void
  clearSelection: () => void
  setLastSelectedId: (id: string | null) => void

  // Compatible with older interfaces
  addGameId: (gameId: string) => void
  removeGameId: (gameId: string) => void
  clearGameIds: () => void

  // Calculating properties
  get gameIds(): string[]
}

export const useGameBatchEditorStore = create<GameBatchEditorStore>((set, get) => ({
  selectedGamesMap: {},
  isBatchMode: false,
  lastSelectedId: null,

  // Calculated Properties - Compatible with old code
  get gameIds(): string[] {
    return Object.keys(get().selectedGamesMap)
  },

  // Select a game
  selectGame: (gameId: string): void => {
    set((state) => {
      // If already checked, no need to change
      if (state.selectedGamesMap[gameId]) return state

      const newMap = { ...state.selectedGamesMap, [gameId]: true }
      const selectedCount = Object.keys(newMap).length

      return {
        selectedGamesMap: newMap,
        isBatchMode: selectedCount > 1
      }
    })
    console.warn(`[DEBUG] Select game: ${gameId}`)
  },

  // Unselect a game
  unselectGame: (gameId: string): void => {
    set((state) => {
      // If unselected, no change is necessary
      if (!state.selectedGamesMap[gameId]) return state

      const newMap = { ...state.selectedGamesMap }
      delete newMap[gameId]

      const selectedCount = Object.keys(newMap).length

      return {
        selectedGamesMap: newMap,
        isBatchMode: selectedCount > 1
      }
    })
    console.warn(`[DEBUG] Unselect game: ${gameId}`)
  },

  // Clear all selections
  clearSelection: (): void => {
    set({
      selectedGamesMap: {},
      isBatchMode: false
    })
  },

  // Setting the last selected ID
  setLastSelectedId: (id: string | null): void => {
    set({ lastSelectedId: id })
  },

  // Compatible with old methods
  addGameId: (gameId: string): void => {
    get().selectGame(gameId)
  },

  removeGameId: (gameId: string): void => {
    get().unselectGame(gameId)
  },

  clearGameIds: (): void => {
    get().clearSelection()
  }
}))

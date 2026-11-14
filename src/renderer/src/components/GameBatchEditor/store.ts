import { create } from 'zustand'

export interface SelectionAnchor {
  scopeId: string
  gameId: string
}

export interface SelectionScope {
  scopeId: string
  orderedGameIds: readonly string[]
}

export type SelectionMode = 'add' | 'remove' | 'replace' | 'toggle'

export interface SelectionUpdate {
  gameIds: readonly string[]
  mode: SelectionMode
  // Omit to preserve the anchor; null clears it; an object sets a new anchor.
  anchor?: SelectionAnchor | null
}

interface GameBatchEditorStore {
  // core state
  selectedGamesMap: Partial<Record<string, true>>
  selectionAnchor: SelectionAnchor | null

  // Operating Methods
  updateSelection: (update: SelectionUpdate) => void
  clearSelection: () => void
  setSelectionAnchor: (anchor: SelectionAnchor) => void
  clearSelectionAnchor: (scopeId: string) => void
}

// Calculate batch mode from the selected games instead of maintaining duplicate state.
export const selectIsBatchMode = (state: GameBatchEditorStore): boolean =>
  Object.keys(state.selectedGamesMap).length > 1

export const useGameBatchEditorStore = create<GameBatchEditorStore>((set) => ({
  selectedGamesMap: {},
  selectionAnchor: null,

  // Add, remove, replace or toggle games and commit any anchor change in the same update.
  updateSelection: ({ gameIds, mode, anchor }: SelectionUpdate): void => {
    set((state) => {
      const selectedGamesMap: Partial<Record<string, true>> =
        mode === 'replace' ? {} : { ...state.selectedGamesMap }
      // Repeated IDs represent one game, including when toggling a group.
      for (const gameId of new Set(gameIds)) {
        if (mode === 'remove' || (mode === 'toggle' && selectedGamesMap[gameId])) {
          delete selectedGamesMap[gameId]
        } else {
          selectedGamesMap[gameId] = true
        }
      }

      const selectionAnchor = anchor === undefined ? state.selectionAnchor : anchor

      // Keep unchanged selections stable, as selecting an already checked game is a no-op.
      const selectionUnchanged =
        Object.keys(selectedGamesMap).length === Object.keys(state.selectedGamesMap).length &&
        Object.keys(selectedGamesMap).every((gameId) => state.selectedGamesMap[gameId])
      if (selectionUnchanged && selectionAnchor === state.selectionAnchor) return state

      return {
        selectedGamesMap: selectionUnchanged ? state.selectedGamesMap : selectedGamesMap,
        selectionAnchor
      }
    })
    console.warn('[DEBUG] Update selection (' + mode + '): ' + gameIds.join(', '))
  },

  // Clear all selections and the range anchor.
  clearSelection: (): void => {
    set({ selectedGamesMap: {}, selectionAnchor: null })
  },

  // Setting the range anchor independently of the selected games
  setSelectionAnchor: (anchor: SelectionAnchor): void => {
    set({ selectionAnchor: anchor })
  },

  // Only the list owning the anchor may clear it during teardown.
  clearSelectionAnchor: (scopeId: string): void => {
    set((state) => (state.selectionAnchor?.scopeId === scopeId ? { selectionAnchor: null } : state))
  }
}))

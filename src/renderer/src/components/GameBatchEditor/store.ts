import { create } from 'zustand'

interface GameBatchEditorStore {
  gameIds: string[]
  lastSelectedId: string | null
  setLastSelectedId: (id: string | null) => void
  addGameId: (gameId: string) => void
  removeGameId: (gameId: string) => void
  clearGameIds: () => void
}

export const useGameBatchEditorStore = create<GameBatchEditorStore>((set) => ({
  gameIds: [],
  lastSelectedId: null,
  setLastSelectedId: (id: string | null): void => set({ lastSelectedId: id }),
  addGameId: (gameId: string): void => {
    set((state) => ({ gameIds: [...state.gameIds, gameId] }))
    console.warn(`[DEBUG] Add game: ${gameId}`)
  },
  removeGameId: (gameId: string): void =>
    set((state) => ({ gameIds: state.gameIds.filter((id) => id !== gameId) })),
  clearGameIds: (): void => set({ gameIds: [] })
}))

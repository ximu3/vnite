import { create } from 'zustand'

interface GameBatchEditorStore {
  gameIds: string[]
  setGameIds: (gameIds: string[]) => void
  addGameId: (gameId: string) => void
  removeGameId: (gameId: string) => void
  clearGameIds: () => void
}

export const useGameBatchEditorStore = create<GameBatchEditorStore>((set) => ({
  gameIds: [],
  setGameIds: (gameIds: string[]): void => set({ gameIds }),
  addGameId: (gameId: string): void => set((state) => ({ gameIds: [...state.gameIds, gameId] })),
  removeGameId: (gameId: string): void =>
    set((state) => ({ gameIds: state.gameIds.filter((id) => id !== gameId) })),
  clearGameIds: (): void => set({ gameIds: [] })
}))

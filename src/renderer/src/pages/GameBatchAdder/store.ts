import { create } from 'zustand'
import { BatchGameInfo } from '@appTypes/database'

export type DataSource = 'vndb' | 'igdb' | 'steam' | 'bangumi' | 'ymgal' | 'dlsite'
export type GameStatus = 'idle' | 'loading' | 'success' | 'error' | 'existed'

interface GameBatchAdderState {
  isOpen: boolean
  isLoading: boolean
  games: BatchGameInfo[]
  actions: {
    setIsOpen: (isOpen: boolean) => void
    setIsLoading: (isLoading: boolean) => void
    setGames: (games: BatchGameInfo[]) => void
    updateGame: (dataId: string, updates: Partial<BatchGameInfo>) => void
    removeGame: (dataId: string) => void
  }
}

export const useGameBatchAdderStore = create<GameBatchAdderState>((set) => ({
  isOpen: false,
  isLoading: false,
  games: [],
  actions: {
    setIsOpen: (isOpen): void => set({ isOpen }),
    setIsLoading: (isLoading): void => set({ isLoading }),
    setGames: (games): void => set({ games }),
    updateGame: (dataId, updates): void =>
      set((state) => ({
        games: state.games.map((game) => (game.dataId === dataId ? { ...game, ...updates } : game))
      })),
    removeGame: (dataId): void =>
      set((state) => ({
        games: state.games.filter((game) => game.dataId !== dataId)
      }))
  }
}))

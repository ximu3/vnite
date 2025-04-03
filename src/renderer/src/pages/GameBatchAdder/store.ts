import { create } from 'zustand'

export type DataSource = 'vndb' | 'igdb' | 'steam' | 'bangumi'
export type GameStatus = 'idle' | 'loading' | 'success' | 'error' | 'existed'

export interface Game {
  dataId: string
  name: string
  dataSource: DataSource
  id: string
  status: GameStatus
  dirPath: string
}

interface GameBatchAdderState {
  isOpen: boolean
  isLoading: boolean
  games: Game[]
  actions: {
    setIsOpen: (isOpen: boolean) => void
    setIsLoading: (isLoading: boolean) => void
    setGames: (games: Game[]) => void
    updateGame: (dataId: string, updates: Partial<Game>) => void
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

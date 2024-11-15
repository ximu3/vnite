import { create } from 'zustand'

export type DataSource = 'vndb' | 'igdb' | 'steam'

interface GameBatchAdderState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  gameList: {
    dataId: string
    dataSource: DataSource
    name: string
    id: string
    status: string
  }[]
  setGameList: (
    gameList: {
      dataId: string
      dataSource: DataSource
      name: string
      id: string
      status: string
    }[]
  ) => void
}

export const useGameBatchAdderStore = create<GameBatchAdderState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen): void => set({ isOpen }),
  isLoading: false,
  setIsLoading: (isLoading): void => set({ isLoading }),
  gameList: [],
  setGameList: (gameList): void => set({ gameList })
}))

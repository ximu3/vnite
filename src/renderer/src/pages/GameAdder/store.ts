import { create } from 'zustand'

export type DataSource = 'vndb' | 'igdb' | 'steam' | 'bangumi'

interface GameAdderState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  dbId: string
  setDbId: (dbId: string) => void
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
  name: string
  setName: (name: string) => void
  gameList: {
    id: string
    name: string
    releaseDate: string
    developers: string[]
  }[]
  setGameList: (
    gameList: {
      id: string
      name: string
      releaseDate: string
      developers: string[]
    }[]
  ) => void
  id: string
  setId: (id: string) => void
  screenshotList: string[]
  setScreenshotList: (screenshotList: string[]) => void
  screenshotUrl: string
  setScreenshotUrl: (screenshotUrl: string) => void
}

export const useGameAdderStore = create<GameAdderState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen): void => set({ isOpen }),
  isLoading: false,
  setIsLoading: (isLoading): void => set({ isLoading }),
  dbId: '',
  setDbId: (dbId): void => set({ dbId }),
  dataSource: 'steam',
  setDataSource: (source): void => set({ dataSource: source }),
  name: '',
  setName: (name): void => set({ name }),
  gameList: [],
  setGameList: (gameList): void => set({ gameList }),
  id: '',
  setId: (id): void => set({ id }),
  screenshotList: [],
  setScreenshotList: (screenshotList): void => set({ screenshotList }),
  screenshotUrl: '',
  setScreenshotUrl: (screenshotUrl): void => set({ screenshotUrl })
}))

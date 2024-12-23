import { create } from 'zustand'
import { toast } from 'sonner'

export type DataSource = 'vndb' | 'igdb' | 'steam' | 'bangumi'

export type GameList = {
  id: string
  name: string
  releaseDate: string
  developers: string[]
}[]

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
  gameList: GameList
  setGameList: (gameList: GameList) => void
  id: string
  setId: (id: string) => void
  screenshotList: string[]
  setScreenshotList: (screenshotList: string[]) => void
  screenshotUrl: string
  setScreenshotUrl: (screenshotUrl: string) => void
  handleClose: () => void
}

export const useGameAdderStore = create<GameAdderState>((set, get) => ({
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
  setScreenshotUrl: (screenshotUrl): void => set({ screenshotUrl }),
  handleClose: (): void => {
    const {
      isLoading,
      setIsOpen,
      setDataSource,
      setDbId,
      setId,
      setName,
      setScreenshotList,
      setScreenshotUrl,
      setGameList,
      setIsLoading
    } = get()
    if (isLoading) {
      toast.warning('请等待游戏添加完成')
      return
    }
    setIsOpen(false)
    setDataSource('steam')
    setDbId('')
    setId('')
    setName('')
    setScreenshotList([])
    setScreenshotUrl('')
    setGameList([])
    setIsLoading(false)
  }
}))

export const initializeStore = (defaultDataSource: DataSource): void => {
  useGameAdderStore.setState({ dataSource: defaultDataSource })
}

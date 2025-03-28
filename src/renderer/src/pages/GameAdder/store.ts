import { create } from 'zustand'
import { toast } from 'sonner'
import { useConfigStore } from '~/stores'
import i18next from 'i18next'

export type DataSource = 'vndb' | 'igdb' | 'steam' | 'bangumi' | 'ymgal'

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
  dataSourceId: string
  setDataSourceId: (dataSourceId: string) => void
  backgroundList: string[]
  setBackgroundList: (backgroundList: string[]) => void
  backgroundUrl: string
  setBackgroundUrl: (backgroundUrl: string) => void
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
  dataSourceId: '',
  setDataSourceId: (dataSourceId): void => set({ dataSourceId }),
  backgroundList: [],
  setBackgroundList: (backgroundList): void => set({ backgroundList }),
  backgroundUrl: '',
  setBackgroundUrl: (backgroundUrl): void => set({ backgroundUrl }),
  handleClose: (): void => {
    const {
      isLoading,
      setIsOpen,
      setDataSource,
      setDbId,
      setDataSourceId,
      setName,
      setBackgroundList,
      setBackgroundUrl,
      setGameList,
      setIsLoading
    } = get()
    if (isLoading) {
      toast.warning(i18next.t('adder:gameAdder.loading'))
      return
    }
    setIsOpen(false)
    setDataSource(useConfigStore.getState().getConfigValue('game.scraper.defaultDatasSource'))
    setDbId('')
    setDataSourceId('')
    setName('')
    setBackgroundList([])
    setBackgroundUrl('')
    setGameList([])
    setIsLoading(false)
  }
}))

export const initializeStore = (defaultDataSource: DataSource): void => {
  useGameAdderStore.setState({ dataSource: defaultDataSource })
}

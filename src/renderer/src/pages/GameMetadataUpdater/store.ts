import { create } from 'zustand'

export interface GameMetadataUpdaterStore {
  open: boolean
  setIsOpen: (open: boolean) => void
  showProgress: boolean
  setShowProgress: (showProgress: boolean) => void
  gameIds: string[]
  setGameIds: (gameIds: string[]) => void
  dataSourceId: string
  setDataSourceId: (dataSourceId: string) => void
  dataSource: string
  setDataSource: (dataSource: string) => void
  backgroundUrl: string
  setBackgroundUrl: (backgroundUrl: string) => void
  handleClose: () => void
}

export const useGameMetadataUpdaterStore = create<GameMetadataUpdaterStore>((set) => ({
  open: false,
  setIsOpen: (open) => set({ open }),
  showProgress: false,
  setShowProgress: (showProgress) => set({ showProgress }),
  gameIds: [],
  setGameIds: (gameIds) => set({ gameIds }),
  dataSourceId: '',
  setDataSourceId: (dataSourceId) => set({ dataSourceId }),
  dataSource: '',
  setDataSource: (dataSource) => set({ dataSource }),
  backgroundUrl: '',
  setBackgroundUrl: (backgroundUrl) => set({ backgroundUrl }),
  handleClose: () => {
    set({
      open: false,
      showProgress: false,
      gameIds: [],
      dataSourceId: '',
      dataSource: '',
      backgroundUrl: ''
    })
  }
}))

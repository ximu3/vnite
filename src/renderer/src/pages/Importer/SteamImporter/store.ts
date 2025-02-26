import { create } from 'zustand'

export interface GameInfo {
  appId: number
  name: string
  totalPlayingTime: number
  selected?: boolean
}

interface GameLog {
  name: string
  status: 'success' | 'error'
  error?: string
}

interface ProgressMessage {
  current: number
  total: number
  status: 'started' | 'processing' | 'completed' | 'error' | 'idle'
  message: string
  game?: GameLog
}

interface SteamImporterState {
  isOpen: boolean
  steamId: string
  // Game List Related
  games: GameInfo[]
  isLoadingGames: boolean
  // Progress-related
  progress: number
  status: ProgressMessage['status']
  message: string
  gameLogs: GameLog[]
  // Operating Methods
  setIsOpen: (open: boolean) => void
  setSteamId: (id: string) => void
  setGames: (games: GameInfo[]) => void
  toggleGameSelection: (appId: number) => void
  toggleAllGames: (selected: boolean) => void
  setIsLoadingGames: (loading: boolean) => void
  updateProgress: (data: ProgressMessage) => void
  reset: () => void
}

export const useSteamImporterStore = create<SteamImporterState>((set) => ({
  // initial state
  isOpen: false,
  steamId: '',
  games: [],
  isLoadingGames: false,
  progress: 0,
  status: 'started',
  message: '',
  gameLogs: [],

  // methods
  setIsOpen: (open): void => set({ isOpen: open }),
  setSteamId: (id): void => set({ steamId: id }),
  setGames: (games): void => set({ games }),
  setIsLoadingGames: (loading): void => set({ isLoadingGames: loading }),
  toggleGameSelection: (appId): void =>
    set((state) => ({
      games: state.games.map((game) =>
        game.appId === appId ? { ...game, selected: !game.selected } : game
      )
    })),
  toggleAllGames: (selected): void =>
    set((state) => ({
      games: state.games.map((game) => ({ ...game, selected }))
    })),
  updateProgress: (data): void => {
    const { current, total, status, message, game } = data
    set((state) => ({
      progress: total > 0 ? Math.round((current / total) * 100) : 0,
      status,
      message,
      gameLogs: game ? [...state.gameLogs, game] : state.gameLogs
    }))
  },
  reset: (): void => {
    set({
      progress: 0,
      status: 'started',
      message: '',
      gameLogs: []
    })
  }
}))

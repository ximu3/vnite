import { create } from 'zustand'

interface GameLog {
  name: string
  status: 'success' | 'error'
  error?: string
}

interface ProgressMessage {
  current: number
  total: number
  status: 'started' | 'processing' | 'completed' | 'error'
  message: string
  game?: GameLog
}

interface SteamImporterState {
  isOpen: boolean
  steamId: string
  // Progress-related
  progress: number
  status: ProgressMessage['status']
  message: string
  gameLogs: GameLog[]
  // Operating Methods
  setIsOpen: (open: boolean) => void
  setSteamId: (id: string) => void
  updateProgress: (ProgressMessage) => void
  reset: () => void
}

export const useSteamImporterStore = create<SteamImporterState>((set) => ({
  // initial state
  isOpen: false,
  steamId: '',
  progress: 0,
  status: 'started',
  message: '',
  gameLogs: [],

  // methods
  setIsOpen: (open): void => set({ isOpen: open }),
  setSteamId: (id): void => set({ steamId: id }),
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

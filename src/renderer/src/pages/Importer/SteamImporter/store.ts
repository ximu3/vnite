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
  // 对话框状态
  isOpen: boolean
  // Steam ID
  steamId: string
  // 进度相关
  progress: number
  status: ProgressMessage['status']
  message: string
  gameLogs: GameLog[]

  // 操作方法
  setIsOpen: (open: boolean) => void
  setSteamId: (id: string) => void
  updateProgress: (ProgressMessage) => void
  reset: () => void
}

export const useSteamImporterStore = create<SteamImporterState>((set) => ({
  // 初始状态
  isOpen: false,
  steamId: '',
  progress: 0,
  status: 'started',
  message: '',
  gameLogs: [],

  // 方法
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

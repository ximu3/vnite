import { create } from 'zustand'

interface GameMetaInfo {
  name: string
  genre?: string
  addDate?: string
  lastRunDate?: string
  score?: number
}

interface GameRegistry {
  // 只存储游戏ID和最小元数据，不存储完整数据
  gameIds: string[]
  gameMetaIndex: Record<string, GameMetaInfo>

  // 注册表管理方法
  registerGame: (gameId: string, metaInfo: GameMetaInfo) => void
  unregisterGame: (gameId: string) => void
  setGameIds: (ids: string[]) => void
  updateGameMeta: (gameId: string, metaInfo: Partial<GameMetaInfo>) => void

  // 初始化状态
  initialized: boolean
  setInitialized: (value: boolean) => void
}

export const useGameRegistry = create<GameRegistry>((set) => ({
  gameIds: [],
  gameMetaIndex: {},
  initialized: false,

  registerGame: (gameId, metaInfo): void =>
    set((state) => ({
      gameIds: state.gameIds.includes(gameId) ? state.gameIds : [...state.gameIds, gameId],
      gameMetaIndex: { ...state.gameMetaIndex, [gameId]: metaInfo }
    })),

  unregisterGame: (gameId): void =>
    set((state) => ({
      gameIds: state.gameIds.filter((id) => id !== gameId),
      gameMetaIndex: Object.fromEntries(
        Object.entries(state.gameMetaIndex).filter(([id]) => id !== gameId)
      )
    })),

  setGameIds: (ids): void => set({ gameIds: ids }),

  updateGameMeta: (gameId, metaInfo): void =>
    set((state) => {
      if (!state.gameMetaIndex[gameId]) return state

      return {
        gameMetaIndex: {
          ...state.gameMetaIndex,
          [gameId]: {
            ...state.gameMetaIndex[gameId],
            ...metaInfo
          }
        }
      }
    }),

  setInitialized: (value): void => set({ initialized: value })
}))

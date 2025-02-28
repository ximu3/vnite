import { create } from 'zustand'

interface GameBatchEditorStore {
  // 核心状态
  selectedGamesMap: Record<string, boolean>
  isBatchMode: boolean
  lastSelectedId: string | null

  // 操作方法
  selectGame: (gameId: string) => void
  unselectGame: (gameId: string) => void
  clearSelection: () => void
  setLastSelectedId: (id: string | null) => void

  // 兼容旧接口
  addGameId: (gameId: string) => void
  removeGameId: (gameId: string) => void
  clearGameIds: () => void

  // 计算属性
  get gameIds(): string[]
}

export const useGameBatchEditorStore = create<GameBatchEditorStore>((set, get) => ({
  selectedGamesMap: {},
  isBatchMode: false,
  lastSelectedId: null,

  // 计算属性 - 兼容旧代码
  get gameIds(): string[] {
    return Object.keys(get().selectedGamesMap)
  },

  // 选中一个游戏
  selectGame: (gameId: string): void => {
    set((state) => {
      // 如果已选中，无需更改
      if (state.selectedGamesMap[gameId]) return state

      const newMap = { ...state.selectedGamesMap, [gameId]: true }
      const selectedCount = Object.keys(newMap).length

      return {
        selectedGamesMap: newMap,
        isBatchMode: selectedCount > 1
      }
    })
    console.warn(`[DEBUG] Select game: ${gameId}`)
  },

  // 取消选中一个游戏
  unselectGame: (gameId: string): void => {
    set((state) => {
      // 如果未选中，无需更改
      if (!state.selectedGamesMap[gameId]) return state

      const newMap = { ...state.selectedGamesMap }
      delete newMap[gameId]

      const selectedCount = Object.keys(newMap).length

      return {
        selectedGamesMap: newMap,
        isBatchMode: selectedCount > 1
      }
    })
    console.warn(`[DEBUG] Unselect game: ${gameId}`)
  },

  // 清空所有选择
  clearSelection: (): void => {
    set({
      selectedGamesMap: {},
      isBatchMode: false
    })
  },

  // 设置最后选择的ID
  setLastSelectedId: (id: string | null): void => {
    set({ lastSelectedId: id })
  },

  // 兼容旧方法
  addGameId: (gameId: string): void => {
    get().selectGame(gameId)
  },

  removeGameId: (gameId: string): void => {
    get().unselectGame(gameId)
  },

  clearGameIds: (): void => {
    get().clearSelection()
  }
}))

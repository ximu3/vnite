import { create, StoreApi, UseBoundStore } from 'zustand'
import { getValueByPath, setValueByPath } from '@appUtils'
import { gameLocalDoc, DEFAULT_GAME_LOCAL_VALUES } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { syncTo } from '../utils'

// 单个游戏本地 store 的类型定义
export interface SingleGameLocalState {
  data: gameLocalDoc | null
  initialized: boolean

  getValue: <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    path: Path
  ) => Get<gameLocalDoc, Path>

  setValue: <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    path: Path,
    value: Get<gameLocalDoc, Path>
  ) => Promise<void>

  initialize: (data: gameLocalDoc) => void

  getData: () => gameLocalDoc | null
}

// 正确定义 store 类型
type GameLocalStore = UseBoundStore<StoreApi<SingleGameLocalState>>

// 游戏本地 store 缓存
const gameLocalStores: Record<string, GameLocalStore> = {}

/**
 * 获取或创建游戏本地 store
 */
export function getGameLocalStore(gameId: string): GameLocalStore {
  if (!gameLocalStores[gameId]) {
    gameLocalStores[gameId] = create<SingleGameLocalState>((set, get) => ({
      data: null,
      initialized: false,

      getValue: <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
        path: Path
      ): Get<gameLocalDoc, Path> => {
        const state = get()
        if (!state.initialized || !state.data) {
          return getValueByPath(DEFAULT_GAME_LOCAL_VALUES, path)
        }

        const value = getValueByPath(state.data, path)
        return value !== undefined ? value : getValueByPath(DEFAULT_GAME_LOCAL_VALUES, path)
      },

      setValue: async <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
        path: Path,
        value: Get<gameLocalDoc, Path>
      ): Promise<void> => {
        // 创建当前数据的深拷贝
        const currentData = get().data ? JSON.parse(JSON.stringify(get().data)) : {}

        // 检查值是否真的变化了
        const currentValue = getValueByPath(currentData, path)
        if (JSON.stringify(currentValue) === JSON.stringify(value)) {
          return // 无变化，跳过更新
        }

        // 更新本地数据
        setValueByPath(currentData, path, value)
        set({ data: currentData })

        // 异步更新到数据库，带防抖
        await syncTo('game-local', gameId, currentData)
      },

      initialize: (data: gameLocalDoc): void => {
        set({
          data,
          initialized: true
        })
      },

      getData: (): gameLocalDoc | null => get().data
    }))
  }

  return gameLocalStores[gameId]
}

/**
 * 批量初始化游戏本地 store
 */
export function initializeGameLocalStores(documents: Record<string, gameLocalDoc>): void {
  // 初始化每个游戏的 store
  Object.entries(documents).forEach(([gameId, gameData]) => {
    const store = getGameLocalStore(gameId)
    store.getState().initialize(gameData)
  })
}

/**
 * 清理不活跃的 store
 */
export function cleanupInactiveLocalStores(activeGameIds: string[]): void {
  const activeSet = new Set(activeGameIds)
  Object.keys(gameLocalStores).forEach((id) => {
    if (!activeSet.has(id)) {
      delete gameLocalStores[id]
    }
  })
}

/**
 * 获取缓存中的所有游戏
 */
export function getCachedGameLocalIds(): string[] {
  return Object.keys(gameLocalStores)
}

/**
 * 删除指定游戏的本地 store
 * @param gameId 要删除的游戏ID
 */
export function deleteGameLocalStore(gameId: string): void {
  if (gameLocalStores[gameId]) {
    delete gameLocalStores[gameId]
    console.log(`[Store] 游戏本地 store ${gameId} 已删除`)
  }
}

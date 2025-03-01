import { create, StoreApi, UseBoundStore } from 'zustand'
import { getValueByPath, setValueByPath } from '@appUtils'
import { gameDoc, DEFAULT_GAME_VALUES } from '@appTypes/database'
import { useGameRegistry } from './gameRegistry'
import type { Get, Paths } from 'type-fest'
import { syncTo } from '../utils'

// 单个游戏 store 的类型定义
export interface SingleGameState {
  data: gameDoc | null
  initialized: boolean

  getValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    path: Path
  ) => Get<gameDoc, Path>

  setValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    path: Path,
    value: Get<gameDoc, Path>
  ) => Promise<void>

  initialize: (data: gameDoc) => void

  getData: () => gameDoc | null
}

// 正确定义 store 类型
type GameStore = UseBoundStore<StoreApi<SingleGameState>>

// 游戏 store 缓存
const gameStores: Record<string, GameStore> = {}

// 提取基本元数据信息
function extractMetaInfo(data: gameDoc): {
  name: string
  genres?: string[]
  addDate?: string
  lastRunDate?: string
} {
  return {
    name: data.metadata?.name || '',
    genres: data.metadata?.genres,
    addDate: data.record?.addDate,
    lastRunDate: data.record?.lastRunDate
  }
}

// 游戏 store 创建函数
export function getGameStore(gameId: string): GameStore {
  if (!gameStores[gameId]) {
    gameStores[gameId] = create<SingleGameState>((set, get) => ({
      data: null,
      initialized: false,

      getValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
        path: Path
      ): Get<gameDoc, Path> => {
        const state = get()
        if (!state.initialized || !state.data) {
          return getValueByPath(DEFAULT_GAME_VALUES, path)
        }
        console.log('state.data', state.data.metadata.name)

        const value = getValueByPath(state.data, path)
        return value !== undefined ? value : getValueByPath(DEFAULT_GAME_VALUES, path)
      },

      setValue: async <Path extends Paths<gameDoc, { bracketNotation: true }>>(
        path: Path,
        value: Get<gameDoc, Path>
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

        // 更新元数据索引
        const metaFields = [
          'metadata.name',
          'metadata.genre',
          'record.addDate',
          'record.lastRunDate'
        ]
        if (metaFields.includes(path as string)) {
          useGameRegistry.getState().updateGameMeta(gameId, extractMetaInfo(currentData))
        }

        // 异步更新到数据库
        await syncTo('game', gameId, currentData)
      },

      initialize: (data: gameDoc): void => {
        set({
          data,
          initialized: true
        })

        // 更新注册表
        useGameRegistry.getState().registerGame(gameId, extractMetaInfo(data))
      },

      getData: (): gameDoc | null => get().data
    }))
  }

  return gameStores[gameId]
}

// 批量初始化游戏 store
export function initializeGameStores(documents: Record<string, gameDoc>): void {
  const gameIds = Object.keys(documents)

  // 更新注册表
  useGameRegistry.getState().setGameIds(gameIds)

  // 初始化每个游戏的 store
  Object.entries(documents).forEach(([gameId, gameData]) => {
    const store = getGameStore(gameId)
    store.getState().initialize(gameData)
  })

  useGameRegistry.getState().setInitialized(true)
}

// 清理不活跃的 store
export function cleanupInactiveStores(activeGameIds: string[]): void {
  const activeSet = new Set(activeGameIds)
  Object.keys(gameStores).forEach((id) => {
    if (!activeSet.has(id)) {
      delete gameStores[id]
    }
  })
}

// 获取缓存中的所有游戏
export function getCachedGameIds(): string[] {
  return Object.keys(gameStores)
}

/**
 * 删除指定游戏的 store
 * @param gameId 要删除的游戏ID
 */
export function deleteGameStore(gameId: string): void {
  if (gameStores[gameId]) {
    delete gameStores[gameId]
    console.log(`[Store] 游戏 store ${gameId} 已删除`)
  }
}

import { DEFAULT_GAME_LOCAL_VALUES, gameLocalDoc } from '@appTypes/models'
import { getValueByPath, setValueByPath } from '@appUtils'
import type { Get, Paths } from 'type-fest'
import { create, StoreApi, UseBoundStore } from 'zustand'
import { syncTo } from '../utils'
import { useGamePathStore } from './gamePathStore'

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

type GameLocalStore = UseBoundStore<StoreApi<SingleGameLocalState>>

const gameLocalStores: Record<string, GameLocalStore> = {}

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
        // Create a deep copy of the current data
        const currentData = get().data ? JSON.parse(JSON.stringify(get().data)) : {}

        // Check if the value has actually changed
        const currentValue = getValueByPath(currentData, path)
        if (JSON.stringify(currentValue) === JSON.stringify(value)) {
          return // No change, skip update
        }

        // Updating local data
        setValueByPath(currentData, path, value)
        set({ data: currentData })

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
 * Batch initialize game local store
 */
export function initializeGameLocalStores(documents: Record<string, gameLocalDoc>): void {
  Object.entries(documents).forEach(([gameId, gameData]) => {
    const store = getGameLocalStore(gameId)
    store.getState().initialize(gameData)
  })

  const gamePaths = Object.values(documents)
    .map((doc) => doc.path?.gamePath)
    .filter((p): p is string => !!p)
  useGamePathStore.getState().addPaths(gamePaths)
  useGamePathStore.getState().verifyAll()
}

export function deleteGameLocalStore(gameId: string): void {
  if (gameLocalStores[gameId]) {
    delete gameLocalStores[gameId]
    console.log(`[Store] game local store ${gameId} deleted`)
  }
}

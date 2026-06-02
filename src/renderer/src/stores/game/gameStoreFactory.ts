import { DEFAULT_GAME_VALUES, gameDoc } from '@appTypes/models'
import { getValueByPath, setValueByPath } from '@appUtils'
import type { Get, Paths } from 'type-fest'
import { create, StoreApi, UseBoundStore } from 'zustand'
import { syncTo } from '../utils'
import { type GameMetaInfo, useGameRegistry } from './gameRegistry'

// Type definitions for individual game stores
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

type GameStore = UseBoundStore<StoreApi<SingleGameState>>

const gameStores: Record<string, GameStore> = {}

function getGameValueWithFallback<Path extends Paths<gameDoc, { bracketNotation: true }>>(
  data: gameDoc,
  path: Path
): Get<gameDoc, Path> {
  const value = getValueByPath(data, path)
  return (value !== undefined ? value : getValueByPath(DEFAULT_GAME_VALUES, path)) as Get<
    gameDoc,
    Path
  >
}

// Extract basic metadata information
function extractMetaInfo(data: gameDoc): GameMetaInfo {
  return {
    name: getGameValueWithFallback(data, 'metadata.name'),
    originalName: getGameValueWithFallback(data, 'metadata.originalName'),
    sortName: getGameValueWithFallback(data, 'metadata.sortName'),
    genres: getGameValueWithFallback(data, 'metadata.genres'),
    addDate: getGameValueWithFallback(data, 'record.addDate'),
    lastRunDate: getGameValueWithFallback(data, 'record.lastRunDate'),
    hideFromRecentGames: getGameValueWithFallback(data, 'record.hideFromRecentGames'),
    score: getGameValueWithFallback(data, 'record.score'),
    nsfw: getGameValueWithFallback(data, 'apperance.nsfw')
  }
}

// Game Store Create Functions
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

        const value = getValueByPath(state.data, path)
        return value !== undefined ? value : getValueByPath(DEFAULT_GAME_VALUES, path)
      },

      setValue: async <Path extends Paths<gameDoc, { bracketNotation: true }>>(
        path: Path,
        value: Get<gameDoc, Path>
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

        // Updating the metadata index
        const metaFields = [
          'metadata.name',
          'metadata.originalName',
          'metadata.sortName',
          'metadata.genres',
          'apperance.nsfw',
          'record.addDate',
          'record.lastRunDate',
          'record.hideFromRecentGames',
          'record.score'
        ]
        if (metaFields.includes(path as string)) {
          useGameRegistry.getState().updateGameMeta(gameId, extractMetaInfo(currentData))
        }

        await syncTo('game', gameId, currentData)
      },

      initialize: (data: gameDoc): void => {
        set({
          data,
          initialized: true
        })

        // Updating the registry
        useGameRegistry.getState().registerGame(gameId, extractMetaInfo(data))
      },

      getData: (): gameDoc | null => get().data
    }))
  }

  return gameStores[gameId]
}

// Batch Initialization Game Store
export function initializeGameStores(documents: Record<string, gameDoc>): void {
  const gameIds = Object.keys(documents)

  // Updating the registry
  useGameRegistry.getState().setGameIds(gameIds)

  // Initialize the store for each game
  Object.entries(documents).forEach(([gameId, gameData]) => {
    const store = getGameStore(gameId)
    store.getState().initialize(gameData)
  })

  useGameRegistry.getState().setInitialized(true)
}

export function deleteGameStore(gameId: string): void {
  if (gameStores[gameId]) {
    delete gameStores[gameId]
    console.log(`[Store] game store ${gameId} deleted`)
  }
}

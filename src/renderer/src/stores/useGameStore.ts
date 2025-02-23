import { create } from 'zustand'
import { ipcInvoke, getNestedValue } from '~/utils'
import { DocChange, gameDocs, gameDoc, PathsOf, DEFAULT_GAME_VALUES } from '@appTypes/database'
import type { Get } from 'type-fest'

export interface GameState {
  documents: gameDocs
  initialized: boolean
  getGameValue: <Path extends string[]>(
    gameId: string,
    path: Path & PathsOf<gameDoc>
  ) => Get<gameDoc, Path>
  setGameValue: <Path extends string[]>(
    gameId: string,
    path: Path & PathsOf<gameDoc>,
    value: Get<gameDoc, Path>
  ) => Promise<void>
  initializeStore: (data: GameState['documents']) => void
  setDocument: (docId: string, data: gameDoc) => void
}

const updateDocument = async (docId: string, data: gameDoc): Promise<void> => {
  const change: DocChange = {
    dbName: 'game',
    docId,
    data,
    timestamp: Date.now()
  }

  try {
    await ipcInvoke('db-changed', change)
  } catch (error) {
    console.error('Failed to sync with database:', error)
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  documents: {} as gameDocs,
  initialized: false,

  setDocument: (docId: string, data: gameDoc): void => {
    set((state) => ({
      documents: {
        ...state.documents,
        [docId]: data
      }
    }))
  },

  getGameValue: <Path extends string[]>(
    gameId: string,
    path: Path & PathsOf<gameDoc>
  ): Get<gameDoc, Path> => {
    const state = get()
    if (!state.initialized) {
      return getNestedValue(DEFAULT_GAME_VALUES, path)
    }

    const doc = state.documents[gameId]
    if (!doc) {
      return getNestedValue(DEFAULT_GAME_VALUES, path)
    }

    const value = getNestedValue(doc, path)
    return value !== undefined ? value : getNestedValue(DEFAULT_GAME_VALUES, path)
  },

  // 设置游戏特定路径的值
  setGameValue: async <Path extends string[]>(
    gameId: string,
    path: Path & PathsOf<gameDoc>,
    value: Get<gameDoc, Path>
  ): Promise<void> => {
    // 先更新 store
    set((state) => {
      const newDocuments = { ...state.documents }
      if (!newDocuments[gameId]) {
        newDocuments[gameId] = { ...DEFAULT_GAME_VALUES } as gameDoc
      }

      let current = newDocuments[gameId]
      const lastIndex = path.length - 1

      // 构建嵌套路径
      for (let i = 0; i < lastIndex; i++) {
        const key = path[i]
        if (!(key in current)) {
          current[key] = {}
        }
        current = current[key]
      }

      // 设置最终值
      current[path[lastIndex]] = value

      return { documents: newDocuments }
    })

    // 然后异步更新文档
    await updateDocument(gameId, get().documents[gameId])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

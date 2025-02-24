import { create } from 'zustand'
import { ipcInvoke, getValueByPath } from '~/utils'
import { DocChange, gameDocs, gameDoc, DEFAULT_GAME_VALUES } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export interface GameState {
  documents: gameDocs
  initialized: boolean
  getGameValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ) => Get<gameDoc, Path>
  setGameValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
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

  getGameValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ): Get<gameDoc, Path> => {
    const state = get()
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    if (!state.initialized) {
      return getValueByPath(DEFAULT_GAME_VALUES, pathArray)
    }

    const doc = state.documents[gameId]
    if (!doc) {
      return getValueByPath(DEFAULT_GAME_VALUES, pathArray)
    }

    const value = getValueByPath(doc, pathArray)
    return value !== undefined ? value : getValueByPath(DEFAULT_GAME_VALUES, pathArray)
  },

  // 设置游戏特定路径的值
  setGameValue: async <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameDoc, Path>
  ): Promise<void> => {
    // 先更新 store
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    set((state) => {
      const newDocuments = { ...state.documents }
      if (!newDocuments[gameId]) {
        newDocuments[gameId] = { ...DEFAULT_GAME_VALUES } as gameDoc
      }

      let current = newDocuments[gameId]
      const lastIndex = pathArray.length - 1

      // 构建嵌套路径
      for (let i = 0; i < lastIndex; i++) {
        const key = pathArray[i]
        if (!(key in current)) {
          current[key] = {}
        }
        current = current[key]
      }

      // 设置最终值
      current[pathArray[lastIndex]] = value

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

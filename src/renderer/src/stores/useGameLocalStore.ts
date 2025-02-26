import { create } from 'zustand'
import { ipcInvoke } from '~/utils'
import { getValueByPath, setValueByPath } from '@appUtils'
import {
  DocChange,
  gameLocalDocs,
  gameLocalDoc,
  DEFAULT_GAME_LOCAL_VALUES
} from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export interface GameLocalState {
  documents: gameLocalDocs
  initialized: boolean
  getGameLocalValue: <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ) => Get<gameLocalDoc, Path>
  setGameLocalValue: <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameLocalDoc, Path>
  ) => Promise<void>
  initializeStore: (data: GameLocalState['documents']) => void
  setDocument: (docId: string, data: gameLocalDoc) => void
}

const updateDocument = async (docId: string, data: gameLocalDoc): Promise<void> => {
  const change: DocChange = {
    dbName: 'game-local',
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

export const useGameLocalStore = create<GameLocalState>((set, get) => ({
  documents: {} as gameLocalDocs,
  initialized: false,

  setDocument: (docId: string, data: gameLocalDoc): void => {
    set((state) => ({
      documents: {
        ...state.documents,
        [docId]: data
      }
    }))
  },

  getGameLocalValue: <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ): Get<gameLocalDoc, Path> => {
    const state = get()
    if (!state.initialized) {
      return getValueByPath(DEFAULT_GAME_LOCAL_VALUES, path)
    }

    const doc = state.documents[gameId]
    if (!doc) {
      return getValueByPath(DEFAULT_GAME_LOCAL_VALUES, path)
    }

    const value = getValueByPath(doc, path)
    return value !== undefined ? value : getValueByPath(DEFAULT_GAME_LOCAL_VALUES, path)
  },

  // 设置游戏本地特定路径的值
  setGameLocalValue: async <Path extends Paths<gameLocalDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameLocalDoc, Path>
  ): Promise<void> => {
    const doc = get().documents[gameId]

    setValueByPath(doc, path, value)
    set((state) => ({
      documents: {
        ...state.documents,
        [gameId]: doc
      }
    }))

    // 异步更新本地文档
    await updateDocument(gameId, get().documents[gameId])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

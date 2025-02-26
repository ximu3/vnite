import { create } from 'zustand'
import { ipcInvoke } from '~/utils'
import { getValueByPath, setValueByPath } from '@appUtils'
import {
  DocChange,
  gameCollectionDoc,
  gameCollectionDocs,
  DEFAULT_GAME_COLLECTION_VALUES
} from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export interface GameCollectionState {
  documents: gameCollectionDocs
  initialized: boolean
  getGameCollectionValue: <Path extends Paths<gameCollectionDoc, { bracketNotation: true }>>(
    collectionId: string,
    path: Path
  ) => Get<gameCollectionDoc, Path>
  setGameCollectionValue: <Path extends Paths<gameCollectionDoc, { bracketNotation: true }>>(
    collectionId: string,
    path: Path,
    value: Get<gameCollectionDoc, Path>
  ) => Promise<void>
  initializeStore: (data: GameCollectionState['documents']) => void
  setDocument: (docId: string, data: gameCollectionDoc) => void
}

const updateDocument = async (docId: string, data: gameCollectionDoc): Promise<void> => {
  const change: DocChange = {
    dbName: 'collection',
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

export const useGameCollectionStore = create<GameCollectionState>((set, get) => ({
  documents: {} as gameCollectionDocs,
  initialized: false,

  setDocument: (docId: string, data: gameCollectionDoc): void => {
    set((state) => ({
      documents: {
        ...state.documents,
        [docId]: data
      }
    }))
  },

  getGameCollectionValue: <Path extends Paths<gameCollectionDoc, { bracketNotation: true }>>(
    collectionId: string,
    path: Path
  ): Get<gameCollectionDoc, Path> => {
    const state = get()
    if (!state.initialized) {
      return getValueByPath(DEFAULT_GAME_COLLECTION_VALUES, path)
    }

    const doc = state.documents[collectionId]
    if (!doc) {
      return getValueByPath(DEFAULT_GAME_COLLECTION_VALUES, path)
    }

    const value = getValueByPath(doc, path)
    return value !== undefined ? value : getValueByPath(DEFAULT_GAME_COLLECTION_VALUES, path)
  },

  // 设置游戏本地特定路径的值
  setGameCollectionValue: async <Path extends Paths<gameCollectionDoc, { bracketNotation: true }>>(
    collectionId: string,
    path: Path,
    value: Get<gameCollectionDoc, Path>
  ): Promise<void> => {
    const doc = get().documents[collectionId]

    setValueByPath(doc, path, value)
    set((state) => ({
      documents: {
        ...state.documents,
        [collectionId]: doc
      }
    }))

    // 异步更新本地文档
    await updateDocument(collectionId, get().documents[collectionId])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

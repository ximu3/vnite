import { create } from 'zustand'
import { ipcInvoke } from '~/utils/ipc'
import { DocChange, gameDocs, gameDoc } from '@appTypes/database'

export interface GameState {
  documents: gameDocs
  initialized: boolean
  setNestedValue: (obj: any, path: string[], value: any) => any
  getValue: <T>(docId: string, path: string[], defaultValue: T) => T
  setValue: (docId: string, path: string[], value: any) => Promise<void>
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
    updateDocument(docId, data)
  },

  setNestedValue: (obj: any, path: string[], value: any): any => {
    if (path.length === 0) return value

    const result = { ...obj }
    let current = result

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]
      current[key] = current[key] ?? {}
      current[key] = { ...current[key] }
      current = current[key]
    }

    const lastKey = path[path.length - 1]
    current[lastKey] = value

    return result
  },

  getValue: <T>(docId: string, path: string[], defaultValue: T): T => {
    const state = get()

    if (!state.initialized) return defaultValue

    const doc = state.documents[docId]
    if (!doc) {
      get().setValue(docId, path, defaultValue)
      return defaultValue
    }

    let current = doc
    for (const key of path) {
      if (current === undefined || current === null) {
        get().setValue(docId, path, defaultValue)
        return defaultValue
      }
      current = current[key]
    }

    if (current === undefined) {
      get().setValue(docId, path, defaultValue)
      return defaultValue
    }

    return current as T
  },

  setValue: async (docId: string, path: string[], value: any): Promise<void> => {
    set((state) => {
      const newDocuments = { ...state.documents }

      if (!newDocuments[docId]) {
        newDocuments[docId] = {} as gameDoc
      }

      newDocuments[docId] = get().setNestedValue(newDocuments[docId], path, value)

      updateDocument(docId, newDocuments[docId])

      return { documents: newDocuments }
    })
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

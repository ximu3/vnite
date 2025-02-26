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
import { toast } from 'sonner'

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

  // CollectionsHook 的属性和方法
  addCollection: (name: string, gameId?: string[]) => Promise<string>
  removeCollection: (id: string) => void
  renameCollection: (id: string, name: string) => void
  reorderCollections: (srcId: string, destId: string, edge: 'front' | 'back') => void
  reorderGamesInCollection: (
    collectionId: string,
    srcId: string,
    destId: string,
    edge: 'front' | 'back'
  ) => void
  addGameToCollection: (collectionId: string, gameId: string) => void
  addGamesToCollection: (collectionId: string, gameIds: string[]) => void
  removeGameFromCollection: (collectionId: string, gameId: string) => void
  removeGamesFromCollection: (collectionId: string, gameIds: string[]) => void
  removeGameFromAllCollections: (gameId: string) => void
  removeGamesFromAllCollections: (gameIds: string[]) => void
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
    }),

  // CollectionsHook 的方法
  addCollection: async (name: string, gameIds?: string[]): Promise<string> => {
    try {
      const id = await ipcInvoke<string>('generate-uuid')

      const newCollection: gameCollectionDoc = {
        _id: id,
        name,
        games: gameIds ? [...gameIds] : []
      }

      set((state) => ({
        documents: { ...state.documents, [id]: newCollection }
      }))
      return id
    } catch (error) {
      console.error('Failed to add collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to add collection: ${error.message}`)
      } else {
        toast.error('Failed to add collection: An unknown error occurred')
      }
      return ''
    }
  },
  removeCollection: (id: string): void => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        delete newDocuments[id]
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to remove collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to remove collection: ${error.message}`)
      } else {
        toast.error('Failed to remove collection: An unknown error occurred')
      }
    }
  },
  renameCollection: (id: string, name: string): void => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        const collection = newDocuments[id]
        if (collection) {
          newDocuments[id] = { ...collection, name }
        }
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to rename collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to rename collection: ${error.message}`)
      } else {
        toast.error('Failed to rename collection: An unknown error occurred')
      }
    }
  },
  reorderCollections: (srcId: string, destId: string, edge: 'front' | 'back'): void => {
    try {
      if (srcId === destId) return

      set((state) => {
        const insertOffset = edge === 'back' ? 1 : 0
        const prevDocuments = { ...state.documents }
        const newDocuments: gameCollectionDocs = {}
        const keys = Object.keys(prevDocuments)
        const [srcKey] = keys.splice(keys.indexOf(srcId), 1)
        keys.splice(keys.indexOf(destId) + insertOffset, 0, srcKey)
        keys.forEach((id) => {
          newDocuments[id] = prevDocuments[id]
        })
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to reorder collections:', error)
      if (error instanceof Error) {
        toast.error(`Failed to reorder collections: ${error.message}`)
      } else {
        toast.error('Failed to reorder collections: An unknown error occurred')
      }
    }
  },
  reorderGamesInCollection: (
    collectionId: string,
    srcId: string,
    destId: string,
    edge: 'front' | 'back'
  ): void => {
    try {
      if (srcId === destId) return

      set((state) => {
        const insertOffset = edge === 'back' ? 1 : 0
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]
        if (!collection) return state // Or handle the error as you see fit
        const games = [...collection.games]

        const [srcKey] = games.splice(games.indexOf(srcId), 1)
        games.splice(games.indexOf(destId) + insertOffset, 0, srcKey)

        newDocuments[collectionId] = { ...collection, games }
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to reorder games in collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to reorder games in collection: ${error.message}`)
      } else {
        toast.error('Failed to reorder games in collection: An unknown error occurred')
      }
    }
  },
  addGameToCollection: (collectionId: string, gameId: string): void => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]
        if (!collection) {
          throw new Error('Collection not found')
        }
        const newCollection = {
          ...collection,
          games: [...collection.games, gameId]
        }
        newDocuments[collectionId] = newCollection
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to add game to collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to add game to collection: ${error.message}`)
      } else {
        toast.error('Failed to add game to collection: An unknown error occurred')
      }
    }
  },
  addGamesToCollection: (collectionId: string, gameIds: string[]): void => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]

        if (!collection) {
          throw new Error('Collection not found')
        }

        // Use Set to Avoid Adding the Same Game ID Over and Over Again
        const updatedGames = new Set([...collection.games, ...gameIds])

        const newCollection = {
          ...collection,
          games: Array.from(updatedGames) // Converting a Set back to an Array
        }

        newDocuments[collectionId] = newCollection
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to add games to collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to add games to collection: ${error.message}`)
      } else {
        toast.error('Failed to add games to collection: An unknown error occurred')
      }
    }
  },
  removeGameFromCollection: (collectionId: string, gameId: string): void => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]
        if (!collection) {
          throw new Error('Collection not found')
        }

        const updatedGames = collection.games.filter((id) => id !== gameId)

        if (updatedGames.length === 0) {
          delete newDocuments[collectionId]
        } else {
          newDocuments[collectionId] = { ...collection, games: updatedGames }
        }
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to remove game from collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to remove game from collection: ${error.message}`)
      } else {
        toast.error('Failed to remove game from collection: An unknown error occurred')
      }
    }
  },
  removeGamesFromCollection: (collectionId: string, gameIds: string[]): void => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]
        if (!collection) {
          throw new Error('Collection not found')
        }

        const updatedGames = collection.games.filter((id) => !gameIds.includes(id))

        if (updatedGames.length === 0) {
          delete newDocuments[collectionId]
        } else {
          newDocuments[collectionId] = { ...collection, games: updatedGames }
        }
        return { documents: newDocuments }
      })
    } catch (error) {
      console.error('Failed to remove games from collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to remove games from collection: ${error.message}`)
      } else {
        toast.error('Failed to remove games from collection: An unknown error occurred')
      }
    }
  },
  removeGameFromAllCollections: (gameId: string): void => {
    set((state) => {
      const newDocuments: gameCollectionDocs = { ...state.documents }
      for (const [collectionId, collection] of Object.entries(state.documents)) {
        const updatedGames = collection.games.filter((id) => id !== gameId)
        if (updatedGames.length === 0) {
          delete newDocuments[collectionId]
        } else {
          newDocuments[collectionId] = { ...collection, games: updatedGames }
        }
      }
      return { documents: newDocuments }
    })
  },
  removeGamesFromAllCollections: (gameIds: string[]): void => {
    set((state) => {
      const newDocuments: gameCollectionDocs = { ...state.documents }
      for (const [collectionId, collection] of Object.entries(state.documents)) {
        const updatedGames = collection.games.filter((id) => !gameIds.includes(id))
        if (updatedGames.length === 0) {
          delete newDocuments[collectionId]
        } else {
          newDocuments[collectionId] = { ...collection, games: updatedGames }
        }
      }
      return { documents: newDocuments }
    })
  }
}))

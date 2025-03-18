import { create } from 'zustand'
import { ipcInvoke } from '~/utils'
import { getValueByPath, setValueByPath } from '@appUtils'
import {
  gameCollectionDoc,
  gameCollectionDocs,
  DEFAULT_GAME_COLLECTION_VALUES
} from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { toast } from 'sonner'
import { syncTo } from '../utils'

export interface GameCollectionState {
  documents: gameCollectionDocs
  initialized: boolean
  setDocuments: (data: gameCollectionDocs) => void
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

export const useGameCollectionStore = create<GameCollectionState>((set, get) => ({
  documents: {} as gameCollectionDocs,
  initialized: false,

  setDocuments: (data: gameCollectionDocs): void => {
    set({ documents: data })
  },

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

    await syncTo('game-collection', collectionId, get().documents[collectionId])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    }),

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

      await syncTo('game-collection', id, newCollection)
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
  removeCollection: async (id: string): Promise<void> => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        delete newDocuments[id]
        return { documents: newDocuments }
      })
      await syncTo('game-collection', id, '#delete')
    } catch (error) {
      console.error('Failed to remove collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to remove collection: ${error.message}`)
      } else {
        toast.error('Failed to remove collection: An unknown error occurred')
      }
    }
  },
  renameCollection: async (id: string, name: string): Promise<void> => {
    try {
      set((state) => {
        const newDocuments = { ...state.documents }
        const collection = newDocuments[id]
        if (collection) {
          newDocuments[id] = { ...collection, name }
        }
        return { documents: newDocuments }
      })
      await syncTo('game-collection', id, get().documents[id])
    } catch (error) {
      console.error('Failed to rename collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to rename collection: ${error.message}`)
      } else {
        toast.error('Failed to rename collection: An unknown error occurred')
      }
    }
  },
  reorderCollections: async (
    srcId: string,
    destId: string,
    edge: 'front' | 'back'
  ): Promise<void> => {
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
      await syncTo('game-collection', '#all', get().documents)
    } catch (error) {
      console.error('Failed to reorder collections:', error)
      if (error instanceof Error) {
        toast.error(`Failed to reorder collections: ${error.message}`)
      } else {
        toast.error('Failed to reorder collections: An unknown error occurred')
      }
    }
  },
  reorderGamesInCollection: async (
    collectionId: string,
    srcId: string,
    destId: string,
    edge: 'front' | 'back'
  ): Promise<void> => {
    try {
      if (srcId === destId) return

      set((state) => {
        const insertOffset = edge === 'back' ? 1 : 0
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]
        if (!collection) return state
        const games = [...collection.games]

        const [srcKey] = games.splice(games.indexOf(srcId), 1)
        games.splice(games.indexOf(destId) + insertOffset, 0, srcKey)

        newDocuments[collectionId] = { ...collection, games }
        return { documents: newDocuments }
      })

      await syncTo('game-collection', collectionId, get().documents[collectionId])
    } catch (error) {
      console.error('Failed to reorder games in collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to reorder games in collection: ${error.message}`)
      } else {
        toast.error('Failed to reorder games in collection: An unknown error occurred')
      }
    }
  },
  addGameToCollection: async (collectionId: string, gameId: string): Promise<void> => {
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
      await syncTo('game-collection', collectionId, get().documents[collectionId])
    } catch (error) {
      console.error('Failed to add game to collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to add game to collection: ${error.message}`)
      } else {
        toast.error('Failed to add game to collection: An unknown error occurred')
      }
    }
  },
  addGamesToCollection: async (collectionId: string, gameIds: string[]): Promise<void> => {
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
      await syncTo('game-collection', collectionId, get().documents[collectionId])
    } catch (error) {
      console.error('Failed to add games to collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to add games to collection: ${error.message}`)
      } else {
        toast.error('Failed to add games to collection: An unknown error occurred')
      }
    }
  },
  removeGameFromCollection: async (collectionId: string, gameId: string): Promise<void> => {
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
      await syncTo('game-collection', collectionId, get().documents[collectionId])
    } catch (error) {
      console.error('Failed to remove game from collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to remove game from collection: ${error.message}`)
      } else {
        toast.error('Failed to remove game from collection: An unknown error occurred')
      }
    }
  },
  removeGamesFromCollection: async (collectionId: string, gameIds: string[]): Promise<void> => {
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
      await syncTo('game-collection', collectionId, get().documents[collectionId])
    } catch (error) {
      console.error('Failed to remove games from collection:', error)
      if (error instanceof Error) {
        toast.error(`Failed to remove games from collection: ${error.message}`)
      } else {
        toast.error('Failed to remove games from collection: An unknown error occurred')
      }
    }
  },
  removeGameFromAllCollections: async (gameId: string): Promise<void> => {
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
    await syncTo('game-collection', '#all', get().documents)
  },
  removeGamesFromAllCollections: async (gameIds: string[]): Promise<void> => {
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
    await syncTo('game-collection', '#all', get().documents)
  }
}))

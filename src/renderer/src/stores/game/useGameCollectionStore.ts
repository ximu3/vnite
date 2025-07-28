import { create } from 'zustand'
import { getValueByPath, setValueByPath, generateUUID } from '@appUtils'
import {
  gameCollectionDoc,
  gameCollectionDocs,
  DEFAULT_GAME_COLLECTION_VALUES
} from '@appTypes/models'
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
  checkCollectionExists: (collectionId: string) => boolean
  getAllCollections: () => { id: string; name: string }[]
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

// Helper function: Determine if rebalancing is needed
function _shouldRebalance(collections: gameCollectionDoc[]): boolean {
  // Sort
  const sorted = [...collections].sort((a, b) => a.sort - b.sort)

  // Check if the gap between adjacent elements' sort values is too small
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].sort - sorted[i - 1].sort < 1) {
      return true
    }
  }
  return false
}

// Helper function: Rebalance sort values for all collections
function _rebalanceCollections(collections: gameCollectionDocs): void {
  const sortedCollections = Object.values(collections).sort((a, b) => a.sort - b.sort)

  // Reassign sort values starting from 100 with intervals of 100
  sortedCollections.forEach((collection, index) => {
    collections[collection._id].sort = (index + 1) * 100
  })
}

// Initialize sort values function
const initializeSortValues = (collections: gameCollectionDocs): gameCollectionDocs => {
  const updatedCollections = { ...collections }

  // Check if any collection is missing the sort field
  const needsInitialization = Object.values(collections).some((col) => col.sort === undefined)

  if (needsInitialization) {
    // Sort by object keys (maintain original order)
    const collectionIds = Object.keys(collections)

    // Assign sort values for each collection, starting from 100, incrementing by 100
    collectionIds.forEach((id, index) => {
      updatedCollections[id] = {
        ...updatedCollections[id],
        sort: (index + 1) * 100
      }
    })
  }

  return updatedCollections
}

export const useGameCollectionStore = create<GameCollectionState>((set, get) => ({
  documents: {} as gameCollectionDocs,
  initialized: false,

  setDocuments: (data: gameCollectionDocs): void => {
    // Ensure all collections have sort values
    const initializedData = initializeSortValues(data)
    set({ documents: initializedData })
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

  checkCollectionExists: (collectionId: string): boolean => {
    const state = get()
    return !!state.documents[collectionId]
  },

  getAllCollections: (): { id: string; name: string }[] => {
    const state = get()
    // Sort collections by sort value
    const sortedCollections = Object.values(state.documents).sort((a, b) => a.sort - b.sort)
    return sortedCollections.map((col) => ({
      id: col._id,
      name: col.name || 'Unnamed Collection'
    }))
  },

  initializeStore: (data): void => {
    // Initialize sort values
    const initializedData = initializeSortValues(data)
    set({
      documents: initializedData,
      initialized: true
    })
  },

  addCollection: async (name: string, gameIds?: string[]): Promise<string> => {
    try {
      const id = generateUUID()

      // Calculate new sort value
      const collections = Object.values(get().documents)
      const highestSort =
        collections.length > 0 ? Math.max(...collections.map((col) => col.sort || 0)) : 0
      const newSort = highestSort + 100 // Use 100 as interval for easier insertion later

      const newCollection: gameCollectionDoc = {
        _id: id,
        name,
        sort: newSort,
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
        const collections = { ...state.documents }
        const srcCollection = collections[srcId]
        const destCollection = collections[destId]

        if (!srcCollection || !destCollection) return state

        // Get all collections sorted by sort value
        const sortedCollections = Object.values(collections).sort((a, b) => a.sort - b.sort)

        // Find target position
        let newSort
        if (edge === 'front') {
          // Calculate sort value for front insertion
          if (sortedCollections[0]._id === destId) {
            // If target is the first one, set smaller sort value
            newSort = destCollection.sort - 100
          } else {
            // Find the element before target
            const destIndex = sortedCollections.findIndex((c) => c._id === destId)
            const prevCollection = sortedCollections[destIndex - 1]
            newSort = (prevCollection.sort + destCollection.sort) / 2
          }
        } else {
          // Back insertion
          if (sortedCollections[sortedCollections.length - 1]._id === destId) {
            // If target is the last one, set larger sort value
            newSort = destCollection.sort + 100
          } else {
            // Find the element after target
            const destIndex = sortedCollections.findIndex((c) => c._id === destId)
            const nextCollection = sortedCollections[destIndex + 1]
            newSort = (destCollection.sort + nextCollection.sort) / 2
          }
        }

        // Update source collection's sort value
        collections[srcId] = {
          ...srcCollection,
          sort: newSort
        }

        // If sort values become too close or too large, trigger rebalancing
        if (Math.abs(newSort) > 10000 || _shouldRebalance(Object.values(collections))) {
          _rebalanceCollections(collections)
        }

        return { documents: collections }
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
        const newDocuments = { ...state.documents }
        const collection = newDocuments[collectionId]
        if (!collection) return state
        const games = [...collection.games]

        const insertOffset = edge === 'back' ? 1 : 0
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

        // Use Set to avoid duplicate game IDs
        const updatedGames = new Set([...collection.games, ...gameIds])

        const newCollection = {
          ...collection,
          games: Array.from(updatedGames) // Convert Set back to array
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

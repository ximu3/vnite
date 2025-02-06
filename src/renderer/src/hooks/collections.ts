import { useCallback, useEffect, useRef } from 'react'
import { ipcInvoke } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { toast } from 'sonner'

interface Collection {
  id: string
  name: string
  games: string[]
}

interface Collections {
  [key: string]: Collection
}

interface CollectionsHook {
  collections: Collections
  addCollection: (name: string, gameId?: string[]) => Promise<string>
  removeCollection: (id: string) => void
  renameCollection: (id: string, name: string) => void
  reorderCollections: (srcId: string, destId: string, edge: 'front' | 'back') => void
  addGameToCollection: (collectionId: string, gameId: string) => void
  addGamesToCollection: (collectionId: string, gameIds: string[]) => void
  removeGameFromCollection: (collectionId: string, gameId: string) => void
  removeGamesFromCollection: (collectionId: string, gameIds: string[]) => void
  removeGameFromAllCollections: (gameId: string) => void
  removeGamesFromAllCollections: (gameIds: string[]) => void
}

export function useCollections(): CollectionsHook {
  const [collections, setCollections] = useDBSyncedState<Collections>({}, 'collections.json', [
    '#all'
  ])

  const collectionsRef = useRef(collections)
  useEffect(() => {
    collectionsRef.current = collections
  }, [collections])

  const typedSetCollections = useCallback(
    (updater: Collections | ((prev: Collections) => Collections)) => {
      setCollections(updater as any)
    },
    [setCollections]
  )

  const addCollection = useCallback(
    async (name: string, gameIds?: string[]): Promise<string> => {
      try {
        const id = await ipcInvoke<string>('generate-uuid')

        const newCollection = {
          id,
          name,
          games: gameIds ? [...gameIds] : []
        }

        const newCollections = { ...collections, [id]: newCollection }
        typedSetCollections(newCollections)

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
    [typedSetCollections, collections]
  )

  const removeCollection = useCallback(
    (id: string): void => {
      try {
        const newCollections = { ...collections }
        delete newCollections[id]
        typedSetCollections(newCollections)
      } catch (error) {
        console.error('Failed to remove collection:', error)
        if (error instanceof Error) {
          toast.error(`Failed to remove collection: ${error.message}`)
        } else {
          toast.error('Failed to remove collection: An unknown error occurred')
        }
      }
    },
    [typedSetCollections, collections]
  )

  const renameCollection = useCallback(
    (id: string, name: string): void => {
      try {
        const newCollections = { ...collections }
        newCollections[id].name = name
        typedSetCollections(newCollections)
      } catch (error) {
        console.error('Failed to rename collection:', error)
        if (error instanceof Error) {
          toast.error(`Failed to rename collection: ${error.message}`)
        } else {
          toast.error('Failed to rename collection: An unknown error occurred')
        }
      }
    },
    [typedSetCollections, collections]
  )

  const reorderCollections = useCallback(
    (srcId: string, destId: string, edge: 'front' | 'back'): void => {
      try {
        if (srcId === destId) return

        const insertOffset = edge === 'back' ? 1 : 0
        const prevCollections: Collections = { ...collectionsRef.current }
        const newCollections: Collections = {}
        const keys = Object.keys(prevCollections)
        const [srcKey] = keys.splice(keys.indexOf(srcId), 1)
        keys.splice(keys.indexOf(destId) + insertOffset, 0, srcKey)
        keys.forEach((id) => {
          newCollections[id] = prevCollections[id]
        })
        typedSetCollections({ ...newCollections })
      } catch (error) {
        console.error('Failed to reorder collections:', error)
        if (error instanceof Error) {
          toast.error(`Failed to reorder collections: ${error.message}`)
        } else {
          toast.error('Failed to reorder collections: An unknown error occurred')
        }
      }
    },
    [typedSetCollections]
  )

  const addGameToCollection = useCallback(
    (collectionId: string, gameId: string): void => {
      try {
        const collection = collections[collectionId]
        if (!collection) {
          throw new Error('Collection not found')
        }
        const newCollection = {
          ...collection,
          games: [...collection.games, gameId]
        }
        const newCollections = { ...collections, [collectionId]: newCollection }
        typedSetCollections(newCollections)
      } catch (error) {
        console.error('Failed to add game to collection:', error)
        if (error instanceof Error) {
          toast.error(`Failed to add game to collection: ${error.message}`)
        } else {
          toast.error('Failed to add game to collection: An unknown error occurred')
        }
      }
    },
    [typedSetCollections, collections]
  )

  const addGamesToCollection = useCallback(
    (collectionId: string, gameIds: string[]): void => {
      try {
        const collection = collections[collectionId]

        if (!collection) {
          throw new Error('Collection not found')
        }

        // Use Set to Avoid Adding the Same Game ID Over and Over Again
        const updatedGames = new Set([...collection.games, ...gameIds])

        const newCollection = {
          ...collection,
          games: Array.from(updatedGames) // Converting a Set back to an Array
        }

        const newCollections = { ...collections, [collectionId]: newCollection }
        typedSetCollections(newCollections)
      } catch (error) {
        console.error('Failed to add games to collection:', error)
        if (error instanceof Error) {
          toast.error(`Failed to add games to collection: ${error.message}`)
        } else {
          toast.error('Failed to add games to collection: An unknown error occurred')
        }
      }
    },
    [typedSetCollections, collections]
  )

  const removeGameFromCollection = useCallback(
    (collectionId: string, gameId: string): void => {
      try {
        const collection = collections[collectionId]
        if (!collection) {
          throw new Error('Collection not found')
        }

        const updatedGames = collection.games.filter((id) => id !== gameId)

        if (updatedGames.length === 0) {
          removeCollection(collectionId)
        } else {
          const newCollections = {
            ...collections,
            [collectionId]: { ...collection, games: updatedGames }
          }
          typedSetCollections(newCollections)
          toast.success(`Game removed from collection "${collection.name}"`)
        }
      } catch (error) {
        console.error('Failed to remove game from collection:', error)
        if (error instanceof Error) {
          toast.error(`Failed to remove game from collection: ${error.message}`)
        } else {
          toast.error('Failed to remove game from collection: An unknown error occurred')
        }
      }
    },
    [removeCollection, typedSetCollections, collections]
  )

  const removeGamesFromCollection = useCallback(
    (collectionId: string, gameIds: string[]): void => {
      try {
        const collection = collections[collectionId]
        if (!collection) {
          throw new Error('Collection not found')
        }

        const updatedGames = collection.games.filter((id) => !gameIds.includes(id))

        if (updatedGames.length === 0) {
          removeCollection(collectionId)
        } else {
          const newCollections = {
            ...collections,
            [collectionId]: { ...collection, games: updatedGames }
          }
          typedSetCollections(newCollections)
          toast.success(`Games removed from collection "${collection.name}"`)
        }
      } catch (error) {
        console.error('Failed to remove games from collection:', error)
        if (error instanceof Error) {
          toast.error(`Failed to remove games from collection: ${error.message}`)
        } else {
          toast.error('Failed to remove games from collection: An unknown error occurred')
        }
      }
    },
    [removeCollection, typedSetCollections, collections]
  )

  const removeGameFromAllCollections = useCallback(
    (gameId: string): void => {
      const newCollections = { ...collections }
      for (const [collectionId, collection] of Object.entries(collections)) {
        const updatedGames = collection.games.filter((id) => id !== gameId)
        if (updatedGames.length === 0) {
          delete newCollections[collectionId]
        } else {
          newCollections[collectionId] = { ...collection, games: updatedGames }
        }
      }
      typedSetCollections(newCollections)
    },
    [collections, removeGameFromCollection]
  )

  const removeGamesFromAllCollections = useCallback(
    (gameIds: string[]): void => {
      const newCollections = { ...collections }
      for (const [collectionId, collection] of Object.entries(collections)) {
        const updatedGames = collection.games.filter((id) => !gameIds.includes(id))
        if (updatedGames.length === 0) {
          delete newCollections[collectionId]
        } else {
          newCollections[collectionId] = { ...collection, games: updatedGames }
        }
      }
      typedSetCollections(newCollections)
    },
    [removeGameFromAllCollections]
  )

  return {
    collections,
    addCollection,
    removeCollection,
    renameCollection,
    reorderCollections,
    addGameToCollection,
    addGamesToCollection,
    removeGameFromCollection,
    removeGamesFromCollection,
    removeGameFromAllCollections,
    removeGamesFromAllCollections
  }
}

import { useCallback } from 'react'
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
  addCollection: (name: string, gameId?: string) => Promise<string>
  removeCollection: (id: string) => void
  renameCollection: (id: string, name: string) => void
  addGameToCollection: (collectionId: string, gameId: string) => void
  removeGameFromCollection: (collectionId: string, gameId: string) => void
}

export function useCollections(): CollectionsHook {
  const [collections, setCollections] = useDBSyncedState<Collections>({}, 'collections.json', [
    '#all'
  ])

  const typedSetCollections = useCallback(
    (updater: Collections | ((prev: Collections) => Collections)) => {
      setCollections(updater as any)
    },
    [setCollections]
  )

  const addCollection = useCallback(
    async (name: string, gameId?: string): Promise<string> => {
      try {
        const id = await ipcInvoke<string>('generate-uuid')
        const newCollection = {
          id,
          name,
          games: gameId ? [gameId] : []
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

  return {
    collections,
    addCollection,
    removeCollection,
    renameCollection,
    addGameToCollection,
    removeGameFromCollection
  }
}

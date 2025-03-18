import { useGameRegistry } from './game/gameRegistry'
import { getGameStore, initializeGameStores, deleteGameStore } from './game/gameStoreFactory'
import {
  getGameLocalStore,
  initializeGameLocalStores,
  deleteGameLocalStore
} from './game/gameLocalStoreFactory'
import { useGameCollectionStore } from './game'
import { useConfigStore } from './config/useConfigStore'
import { useConfigLocalStore } from './config/useConfigLocalStore'
import { useAttachmentStore } from './useAttachmentStore'
import { ipcOnUnique, ipcInvoke } from '~/utils/ipc'
import {
  DocChange,
  AttachmentChange,
  gameDocs,
  gameLocalDocs,
  gameCollectionDocs
} from '@appTypes/database'
import { isEqual } from 'lodash'

/**
 * Mapping database names to corresponding data initialization functions
 */
const DB_INITIALIZERS = {
  game: async (data: gameDocs): Promise<void> => {
    initializeGameStores(data)
    console.log(`[DB] game: initialized ${Object.keys(data).length} game store`)
  },
  'game-local': async (data: gameLocalDocs): Promise<void> => {
    initializeGameLocalStores(data)
    console.log(`[DB] game-local: initialized ${Object.keys(data).length} game-local store`)
  },
  'game-collection': async (data: gameCollectionDocs): Promise<void> => {
    useGameCollectionStore.getState().initializeStore(data)
    console.log(
      `[DB] game-collection: initializes ${Object.keys(data).length} collection of games store`
    )
  },
  config: async (data: any): Promise<void> => {
    useConfigStore.getState().initializeStore(data)
    console.log('[DB] config store initialized')
  },
  'config-local': async (data: any): Promise<void> => {
    useConfigLocalStore.getState().initializeStore(data)
    console.log('[DB] config-local store initialized')
  }
}

/**
 * Mapping of functions to handle various database changes
 */
const DB_CHANGE_HANDLERS = {
  game: (docId: string, data: any, deleted: boolean): void => {
    if (deleted) {
      // If the document is deleted, remove it from the registry
      useGameRegistry.getState().unregisterGame(docId)
      // Delete game store
      deleteGameStore(docId)
      console.log(`[DB] Game ${docId} Deleted`)
      return
    }

    // Get game store and update data
    const gameStore = getGameStore(docId)
    const currentData = gameStore.getState().getData()

    // Skip update if no change in data
    if (isEqual(data, currentData)) return

    // If the game store is initialized, update the data
    if (gameStore.getState().initialized) {
      gameStore.getState().initialize(data)
    } else {
      // Otherwise initialize the game store
      gameStore.getState().initialize(data)
      useGameRegistry.getState().registerGame(docId, {
        name: data.metadata?.name || '',
        genre: data.metadata?.genre,
        addDate: data.record?.addDate,
        lastRunDate: data.record?.lastRunDate
      })
    }

    console.log(`[DB] Game ${docId} Data has been updated!`)
  },

  'game-local': (docId: string, data: any, deleted: boolean): void => {
    if (deleted) {
      // Delete game local store
      deleteGameLocalStore(docId)
      console.log(`[DB] Game Local Data ${docId} Deleted`)
      return
    }

    // Get the game's local store and update the data
    const gameLocalStore = getGameLocalStore(docId)
    const currentData = gameLocalStore.getState().getData()

    // Skip update if no change in data
    if (isEqual(data, currentData)) return

    // If the local store for the game has been initialized, update the data
    if (gameLocalStore.getState().initialized) {
      gameLocalStore.getState().initialize(data)
    } else {
      // Otherwise initialize the game local store
      gameLocalStore.getState().initialize(data)
    }

    console.log(`[DB] Game Local Data ${docId} Updated`)
  },

  'game-collection': (docId: string, data: any, deleted: boolean): void => {
    const gameCollectionStore = useGameCollectionStore.getState()

    if (deleted) {
      // Handling game collection deletion
      gameCollectionStore.removeCollection(docId)
      console.log(`[DB] Game Collection ${docId} Removed`)
      return
    }

    // Updated Game Collection
    const currentCollection = gameCollectionStore.documents[docId]
    if (isEqual(data, currentCollection)) return

    gameCollectionStore.setDocument(docId, data)
    console.log(`[DB] Game Collection ${docId} Updated`)
  },

  config: (docId: string, data: any, deleted: boolean): void => {
    const configStore = useConfigStore.getState()

    if (deleted) {
      // Handling configuration deletion
      const currentDocuments = { ...configStore.documents }
      delete currentDocuments[docId]
      configStore.setDocuments(currentDocuments)
      console.log(`[DB] Configuration ${docId} Removed`)
      return
    }

    // Updating the configuration
    const currentValue = configStore.documents[docId]
    if (isEqual(data, currentValue)) return

    configStore.setDocument(docId, data)
    console.log(`[DB] Configuration ${docId} Updated`)
  },

  'config-local': (docId: string, data: any, deleted: boolean): void => {
    const configLocalStore = useConfigLocalStore.getState()

    if (deleted) {
      // Handling Local Configuration Deletion
      const currentDocuments = { ...configLocalStore.documents }
      delete currentDocuments[docId]
      configLocalStore.setDocuments(currentDocuments)
      console.log(`[DB] Local Configuration ${docId} Removed`)
      return
    }

    // Update Local Configuration
    const currentValue = configLocalStore.documents[docId]
    if (isEqual(data, currentValue)) return

    configLocalStore.setDocument(docId, data)
    console.log(`[DB] Local Configuration ${docId} Updated`)
  }
}

/**
 * Establishment of database synchronization
 */
export async function setupDBSync(): Promise<void> {
  console.log('[DB] Setting up database synchronization...')

  // Initialize each database
  const dbNames = Object.keys(DB_INITIALIZERS)

  for (const dbName of dbNames) {
    try {
      // Get all documents
      const data = await ipcInvoke('db-get-all-docs', dbName)
      // Call the corresponding initialization function
      await DB_INITIALIZERS[dbName](data)
    } catch (error) {
      console.error(`[DB] ${dbName} Initialization Failure:`, error)
    }
  }

  // Listening to database changes
  ipcOnUnique('db-changed', (_, change: DocChange) => {
    const { dbName, docId, data } = change
    const isDeleted = data._deleted === true

    // Check if we have a handler for this database
    if (DB_CHANGE_HANDLERS[dbName]) {
      DB_CHANGE_HANDLERS[dbName](docId, data, isDeleted)
    } else {
      console.warn(`[DB] Unable to handle unknown database changes: ${dbName}`)
    }
  })

  // Listening to attachment changes
  ipcOnUnique('attachment-changed', (_event, change: AttachmentChange) => {
    useAttachmentStore.getState().updateTimestamp(change.dbName, change.docId, change.attachmentId)
    useAttachmentStore
      .getState()
      .setAttachmentError(change.dbName, change.docId, change.attachmentId, false)
    console.log(
      `[DB] attachment have been changed: ${change.dbName}/${change.docId}/${change.attachmentId}`
    )
  })

  console.log('[DB] Database synchronization has been set up')
}

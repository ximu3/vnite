import PouchDB from 'pouchdb'
import { SyncOptions, AttachmentReturnType } from './types'
import { convertBufferToFile, convertFileToBuffer, convertBufferToTempFile } from '~/utils'
import { getDataPath, setupProxy } from '~/features/system'
import { getValueByPath, setValueByPath } from '@appUtils'
import { fileTypeFromBuffer } from 'file-type'
import upsertPlugin from 'pouchdb-upsert'
import { net } from 'electron'
import log from 'electron-log/main'
import { ipcManager } from '~/core/ipc'
import { createOfficialRemoteDBWithPermissions } from '~/utils'

PouchDB.plugin(upsertPlugin)

export class BaseDBManager {
  private dbInstances: { [key: string]: PouchDB.Database } = {}
  private changeListeners: { [key: string]: PouchDB.Core.Changes<object> | null } = {}
  private syncHandlers: { [key: string]: PouchDB.Replication.Sync<object> | null } = {}

  constructor() {
    // Wait for the call from main process initialization
  }

  public initAllDatabases(): void {
    this.initDatabase('game')
    this.initDatabase('game-collection')
    this.initDatabase('game-local')
    this.initDatabase('config')
    this.initDatabase('config-local', async (change) => {
      if (change.doc && change.doc._id === 'network') {
        // If network config changed, update the proxy settings
        setupProxy()
      }
    })
    this.initDatabase('plugin')
  }

  private initDatabase(
    dbName: string,
    appendChangeListener?: (
      change: PouchDB.Core.ChangesResponseChange<object>
    ) => void | Promise<void>
  ): PouchDB.Database {
    const dbPath = getDataPath(dbName)
    const db = new PouchDB(dbPath, { auto_compaction: true })

    // Store the database instance
    this.dbInstances[dbName] = db

    this.startChangeListener(dbName, appendChangeListener)

    log.info(`[BaseDB] Database ${dbName} initialized at ${dbPath}`)
    return db
  }

  private getDatabase(dbName: string): PouchDB.Database {
    const db = this.dbInstances[dbName]
    if (!db) {
      throw new Error(`Database ${dbName} not initialized`)
    }
    return db
  }

  async setValue(dbName: string, docId: string, path: string, value: any): Promise<void> {
    const db = this.getDatabase(dbName)

    try {
      if (docId === '#all' && path === '#all') {
        // If docId and path are both '#all', we set all documents in the database
        await this.setAllDocs(dbName, Object.values(value))
        return
      }

      await db.upsert(docId, (doc: any) => {
        if (path === '#all') {
          // If path is '#all', we replace the entire document
          if (value === '#delete') {
            // If value is '#delete', we delete the document
            return { _id: docId, _deleted: true }
          }
          return {
            ...doc,
            ...value
          }
        } else {
          setValueByPath(doc, path, value)
          return doc
        }
      })
    } catch (error) {
      console.error('Error setting value with upsert:', error)
      throw error
    }
  }

  async getValue<T>(dbName: string, docId: string, path: string, defaultValue: T): Promise<T> {
    const db = this.getDatabase(dbName)

    try {
      let doc: any
      try {
        doc = await db.get(docId)
      } catch (err: any) {
        if (err.name === 'not_found') {
          doc = { _id: docId }

          if (path === '#all') {
            // If path is '#all', we initialize the document with default values
            doc = {
              _id: docId,
              ...defaultValue
            }
          } else {
            setValueByPath(doc, path, defaultValue)
          }

          await db.put(doc)
          return defaultValue
        }
        throw err
      }

      if (path === '#all') {
        // If path is '#all', we return the entire document
        return doc as T
      }

      const value = getValueByPath(doc, path)

      if (value === undefined) {
        await this.setValue(dbName, docId, path, defaultValue)
        return defaultValue
      }

      return value as T
    } catch (error) {
      console.error('Error getting value:', error)
      throw error
    }
  }

  async removeDoc(dbName: string, docId: string): Promise<void> {
    const db = this.getDatabase(dbName)

    try {
      const doc = await db.get(docId)
      await db.remove(docId, doc._rev)
    } catch (error) {
      if ((error as any).name === 'not_found') {
        return
      }
      throw error
    }
  }

  async getAllDocs(dbName: string): Promise<Record<string, any>> {
    const db = this.getDatabase(dbName)
    const result = await db.allDocs({ include_docs: true })

    // Convert result.rows to a record with doc._id as key
    return result.rows.reduce(
      (acc, row) => {
        if (row.doc) {
          acc[row.doc._id] = row.doc
        }
        return acc
      },
      {} as Record<string, any>
    )
  }

  async setAllDocs(dbName: string, docs: any[]): Promise<void> {
    const db = this.getDatabase(dbName)

    await Promise.all(
      docs.map((doc) => {
        if (!doc._id) {
          return db.post(doc)
        }

        return db.upsert(doc._id, (existingDoc) => {
          return { ...existingDoc, ...doc }
        })
      })
    )
  }

  async syncAllWithRemote(
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    // Stop all existing syncs
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }
    // Sync each database
    for (const dbName in this.dbInstances) {
      await this.syncWithRemote(dbName, remoteUrl, options)
    }
  }

  async syncAllWithRemoteFull(
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    // Stop all existing syncs
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }
    // Sync each database with full sync
    for (const dbName in this.dbInstances) {
      await this.syncWithRemoteFull(dbName, remoteUrl, options)
    }
    // Finally, auto create live sync for all databases
    await this.syncAllWithRemote(remoteUrl, options)
  }

  async syncWithRemoteFull(
    dbName: string,
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    // Skip local databases
    if (dbName.includes('local')) {
      return
    }

    const localDb = this.getDatabase(dbName)
    const { auth, isOfficial } = options

    const remoteDbName = isOfficial
      ? `${auth?.username}-${dbName}`.replace('user', 'userdb')
      : `vnite-${dbName}`

    const remoteDbUrl = `${remoteUrl}/${remoteDbName}`

    // Check if the remote database exists, if not, create it
    if (isOfficial) {
      await createOfficialRemoteDBWithPermissions(
        remoteUrl,
        remoteDbName,
        auth.username,
        import.meta.env.VITE_COUCHDB_USERNAME,
        import.meta.env.VITE_COUCHDB_PASSWORD
      )
    } else {
      await net.fetch(`${remoteUrl}/${remoteDbName}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Basic ' + btoa(`${auth?.username}:${auth?.password}`)
        }
      })
    }

    const remoteDb = new PouchDB(remoteDbUrl, {
      skip_setup: false,
      auth: auth,
      fetch: net.fetch // Use the net module for fetching, to support system proxy
    })

    try {
      // Full sync without live options
      await localDb.sync(remoteDb, {
        live: false,
        retry: true
      })
      log.info(`[Sync] ${dbName} Full synchronization completed successfully`)
    } catch (error) {
      log.error(`[Sync] ${dbName} Full synchronization setup failed:`, error)
      throw error
    }
  }

  async syncWithRemote(
    dbName: string,
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    // Skip local databases
    if (dbName.includes('local')) {
      return
    }

    const localDb = this.getDatabase(dbName)
    const { auth, isOfficial } = options

    const remoteDbName = isOfficial
      ? `${auth.username}-${dbName}`.replace('user', 'userdb')
      : `vnite-${dbName}`

    const remoteDbUrl = `${remoteUrl}/${remoteDbName}`

    // Check if the remote database exists, if not, create it
    if (isOfficial) {
      await createOfficialRemoteDBWithPermissions(
        remoteUrl,
        remoteDbName,
        auth.username,
        import.meta.env.VITE_COUCHDB_USERNAME,
        import.meta.env.VITE_COUCHDB_PASSWORD
      )
    } else {
      await net.fetch(`${remoteUrl}/${remoteDbName}`, {
        method: 'PUT',
        headers: {
          Authorization: 'Basic ' + btoa(`${auth?.username}:${auth?.password}`)
        }
      })
    }

    const remoteDb = new PouchDB(remoteDbUrl, {
      skip_setup: false,
      auth: auth,
      fetch: net.fetch // Use the net module for fetching, to support system proxy
    })

    // Stop existing syncs
    if (this.syncHandlers[dbName]) {
      this.syncHandlers[dbName].cancel()
    }

    try {
      // Start live sync
      this.syncHandlers[dbName] = localDb
        .sync(remoteDb, {
          live: true,
          retry: true
        })
        .on('change', (info) => {
          console.log(`[${dbName}] sync change:`, info)
          ipcManager.send('db:sync-status', {
            status: 'syncing',
            message: 'Syncing...',
            timestamp: new Date().toISOString()
          })
        })
        .on('paused', () => {
          console.log(`[${dbName}] sync paused`)
          ipcManager.send('db:sync-status', {
            status: 'success',
            message: 'Sync paused',
            timestamp: new Date().toISOString()
          })
        })
        .on('active', () => {
          console.log(`[${dbName}] sync resumed`)
          ipcManager.send('db:sync-status', {
            status: 'syncing',
            message: 'Syncing...',
            timestamp: new Date().toISOString()
          })
        })
        .on('denied', (err) => {
          console.error(`[${dbName}] sync denied:`, err)
          ipcManager.send('db:sync-status', {
            status: 'error',
            message: 'Sync denied',
            timestamp: new Date().toISOString()
          })
        })
        .on('error', (err) => {
          console.error(`[${dbName}] sync error:`, err)
          ipcManager.send('db:sync-status', {
            status: 'error',
            message: 'Sync error',
            timestamp: new Date().toISOString()
          })
        })
    } catch (error) {
      log.error(`[Sync] ${dbName} Live synchronization setup failed:`, error)
      throw error
    }
  }

  stopAllSync(): void {
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }
  }

  stopSync(dbName: string): void {
    if (this.syncHandlers[dbName]) {
      this.syncHandlers[dbName].cancel()
      delete this.syncHandlers[dbName]
    }
  }

  async putAttachment(
    dbName: string,
    docId: string,
    attachmentId: string,
    attachment: Buffer | string,
    type?: string
  ): Promise<void> {
    const db = this.getDatabase(dbName)

    // Convert attachment to buffer if it's a file path
    if (typeof attachment === 'string') {
      attachment = await convertFileToBuffer(attachment)
    }

    // If type is not provided, try to detect it from the buffer
    if (!type) {
      type =
        (await fileTypeFromBuffer(attachment as Uint8Array))?.mime || 'application/octet-stream'
    }

    try {
      const doc = await db.get(docId).catch((err) => {
        if (err.name === 'not_found') {
          return null
        }
        throw err
      })

      if (doc) {
        // Document exists, update it with the new attachment
        await db.upsert(docId, (doc: any) => {
          const prevrevpos = '_rev' in doc ? parseInt(doc._rev, 10) : 0
          doc._attachments = doc._attachments || {}

          doc._attachments[attachmentId] = {
            content_type: type,
            data: attachment,
            revpos: prevrevpos + 1
          }

          return doc
        })
      } else {
        // Document does not exist, create a new document and add the attachment
        await db.put({
          _id: docId,
          _attachments: {
            [attachmentId]: {
              content_type: type,
              data: attachment,
              revpos: 1
            }
          }
        })
      }
      // Notify the change to the renderer to sync the attachment content
      ipcManager.send('db:attachment-changed', {
        dbName,
        docId,
        attachmentId: attachmentId,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error putting attachment:', error)
      throw error
    }
  }

  async getAttachment<
    T extends {
      format?: 'buffer' | 'file'
      filePath?: string
      ext?: string
    }
  >(
    dbName: string,
    docId: string,
    attachmentId: string,
    options: T = {
      format: 'buffer',
      filePath: '#temp',
      ext: 'webp'
    } as T
  ): Promise<AttachmentReturnType<T>> {
    const db = this.getDatabase(dbName)

    try {
      const attachment = await db.getAttachment(docId, attachmentId)
      if (!attachment) {
        throw new Error('Attachment not found')
      }

      // If the format is 'file', convert the buffer to a file or temp file
      if (options.format === 'file') {
        if (options.filePath === '#temp' || !options.filePath) {
          // Store the image in a temporary file and return the file path
          return (await convertBufferToTempFile(
            attachment as Buffer,
            options.ext
          )) as AttachmentReturnType<T>
        } else {
          return (await convertBufferToFile(
            attachment as Buffer,
            options.filePath
          )) as AttachmentReturnType<T>
        }
      } else {
        return attachment as AttachmentReturnType<T>
      }
    } catch (error) {
      console.error('Error getting attachment:', error)
      throw error
    }
  }

  async listAttachmentNames(dbName: string, docId: string): Promise<string[]> {
    const db = this.getDatabase(dbName)
    try {
      const doc = await db.get(docId)
      if (doc && doc._attachments) {
        return Object.keys(doc._attachments)
      }
      return []
    } catch (error: any) {
      if (error.name === 'not_found') {
        return []
      }
      throw error
    }
  }

  async checkAttachment(dbName: string, docId: string, attachmentId: string): Promise<boolean> {
    const db = this.getDatabase(dbName)

    try {
      const doc = await db.get(docId)
      return !!doc._attachments?.[attachmentId]
    } catch (error) {
      console.error('Error checking attachment:', error)
      throw error
    }
  }

  async removeAttachment(dbName: string, docId: string, attachmentId: string): Promise<void> {
    const db = this.getDatabase(dbName)

    try {
      const doc = await db.get(docId)

      // Check if attachment exists before trying to remove it
      if (!doc._attachments || !doc._attachments[attachmentId]) {
        return // Skip if attachment doesn't exist
      }

      await db.removeAttachment(docId, attachmentId, doc._rev)
      // Notify the change to the renderer to sync the attachment removal
      ipcManager.send('db:attachment-changed', {
        dbName,
        docId,
        attachmentId,
        timestamp: Date.now()
      })
    } catch (error) {
      if ((error as any).name === 'not_found') {
        return // Skip if document doesn't exist
      }
      console.error('Error removing attachment:', error)
      throw error
    }
  }

  async closeDatabase(dbName: string): Promise<void> {
    const db = this.dbInstances[dbName]
    if (db) {
      this.stopChangeListener(dbName)
      this.stopSync(dbName)
      await db.close()
      delete this.dbInstances[dbName]
    }
  }

  async closeAllDatabases(): Promise<void> {
    for (const dbName in this.dbInstances) {
      await this.closeDatabase(dbName)
    }
  }

  private startChangeListener(
    dbName: string,
    appendChangeListener?: (
      change: PouchDB.Core.ChangesResponseChange<object>
    ) => void | Promise<void>
  ): void {
    if (this.changeListeners[dbName]) {
      this.stopChangeListener(dbName)
    }

    const db = this.getDatabase(dbName)

    this.changeListeners[dbName] = db
      .changes({
        since: 'now',
        live: true,
        include_docs: true
      })
      .on('change', async (change) => {
        try {
          if (!change.doc) return

          const { _id: docId, _rev, ...data } = change.doc
          // Notify the renderer about the change to sync the document
          ipcManager.send('db:doc-changed', {
            dbName,
            docId,
            data: { _id: docId, ...data },
            timestamp: Date.now()
          })

          if (appendChangeListener) {
            await appendChangeListener(change)
          }

          console.log('Database change:', dbName, docId, data)
        } catch (error) {
          console.error('Error handling database change:', error)
        }
      })
  }

  private stopChangeListener(dbName: string): void {
    if (this.changeListeners[dbName]) {
      this.changeListeners[dbName].cancel()
      delete this.changeListeners[dbName]
    }
  }
}

export const baseDBManager = new BaseDBManager()

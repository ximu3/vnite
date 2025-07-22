import PouchDB from 'pouchdb'
import { SyncOptions, AttachmentReturnType } from './types'
import { convertBufferToFile, convertFileToBuffer, convertBufferToTempFile } from '~/utils'
import { getDataPath } from '~/features/system'
import { getValueByPath, setValueByPath } from '@appUtils'
import { fileTypeFromBuffer } from 'file-type'
import upsertPlugin from 'pouchdb-upsert'
import { net } from 'electron'
import log from 'electron-log/main'
import { ipcManager } from '~/core/ipc'
import { createOfficialRemoteDBWithPermissions } from '~/utils'

PouchDB.plugin(upsertPlugin)

export class BaseDBManager {
  // 内部追踪表
  private dbInstances: { [key: string]: PouchDB.Database } = {}
  private changeListeners: { [key: string]: PouchDB.Core.Changes<object> | null } = {}
  private syncHandlers: { [key: string]: PouchDB.Replication.Sync<object> | null } = {}

  constructor() {
    // pass
  }

  public initAllDatabases(): void {
    // 直接在构造函数中初始化所有数据库
    this.initDatabase('game')
    this.initDatabase('game-collection')
    this.initDatabase('game-local')
    this.initDatabase('config')
    this.initDatabase('config-local')
    this.initDatabase('plugin')
  }

  /**
   * 初始化单个数据库并返回实例
   */
  private initDatabase(dbName: string): PouchDB.Database {
    const dbPath = getDataPath(dbName)
    const db = new PouchDB(dbPath, { auto_compaction: true })

    // 将实例存储在内部表中以便管理
    this.dbInstances[dbName] = db

    this.startChangeListener(dbName)

    log.info(`Database ${dbName} initialized at ${dbPath}`)
    return db
  }

  /**
   * 获取特定数据库实例的内部方法
   */
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
        await this.setAllDocs(dbName, Object.values(value))
        return
      }

      await db.upsert(docId, (doc: any) => {
        if (path === '#all') {
          if (value === '#delete') {
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

  /**
   * 同步所有数据库
   */
  async syncAllWithRemote(
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    // 停止所有现有的同步
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }

    // 同步每个数据库
    for (const dbName in this.dbInstances) {
      await this.syncWithRemote(dbName, remoteUrl, options)
    }
  }

  /**
   * 同步所有数据库的完整数据
   */
  async syncAllWithRemoteFull(
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    // 停止所有现有的同步
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }
    for (const dbName in this.dbInstances) {
      await this.syncWithRemoteFull(dbName, remoteUrl, options)
    }
    await this.syncAllWithRemote(remoteUrl, options)
  }

  async syncWithRemoteFull(
    dbName: string,
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    if (dbName.includes('local')) {
      return
    }

    const localDb = this.getDatabase(dbName)
    const { auth, isOfficial } = options

    const remoteDbName = isOfficial
      ? `${auth?.username}-${dbName}`.replace('user', 'userdb')
      : `vnite-${dbName}`

    const remoteDbUrl = `${remoteUrl}/${remoteDbName}`

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
      fetch: net.fetch
    })

    try {
      // 初始同步
      await localDb.sync(remoteDb, {
        live: false,
        retry: true
      })
      console.log(`[${dbName}] Full synchronization completed successfully`)
    } catch (error) {
      console.error(`[${dbName}] Full synchronization setup failed:`, error)
      throw error
    }
  }

  /**
   * 同步单个数据库
   */
  async syncWithRemote(
    dbName: string,
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions
  ): Promise<void> {
    if (dbName.includes('local')) {
      return
    }

    const localDb = this.getDatabase(dbName)
    const { auth, isOfficial } = options

    const remoteDbName = isOfficial
      ? `${auth.username}-${dbName}`.replace('user', 'userdb')
      : `vnite-${dbName}`

    const remoteDbUrl = `${remoteUrl}/${remoteDbName}`

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
      fetch: net.fetch
    })

    // 停止现有的同步
    if (this.syncHandlers[dbName]) {
      this.syncHandlers[dbName].cancel()
    }

    try {
      // 设置同步
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
      console.error(`[${dbName}] Synchronization setup failed:`, error)
      throw error
    }
  }

  /**
   * 停止所有同步
   */
  stopAllSync(): void {
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }
  }

  /**
   * 停止特定数据库的同步
   */
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

    if (typeof attachment === 'string') {
      attachment = await convertFileToBuffer(attachment)
    }

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
        // 文档存在，添加附件
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
        // 文档不存在，创建新文档并添加附件
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

      if (options.format === 'file') {
        if (options.filePath === '#temp' || !options.filePath) {
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
      await db.removeAttachment(docId, attachmentId, doc._rev)
      ipcManager.send('db:attachment-changed', {
        dbName,
        docId,
        attachmentId,
        timestamp: Date.now()
      })
    } catch (error) {
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

  private startChangeListener(dbName: string): void {
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

          ipcManager.send('db:doc-changed', {
            dbName,
            docId,
            data: { _id: docId, ...data },
            timestamp: Date.now()
          })

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

// 创建并导出单例实例
export const baseDBManager = new BaseDBManager()

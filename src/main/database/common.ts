import PouchDB from 'pouchdb'
import { BrowserWindow } from 'electron'
import {
  DocChange,
  DBConfig,
  SyncOptions,
  AttachmentChange,
  SyncStatus,
  AttachmentReturnType
} from '@appTypes/database'
import {
  convertBufferToFile,
  convertFileToBuffer,
  convertBufferToTempFile,
  getDataPath
} from '~/utils'
import { getValueByPath, setValueByPath } from '@appUtils'
import { fileTypeFromBuffer } from 'file-type'
import upsertPlugin from 'pouchdb-upsert'

PouchDB.plugin(upsertPlugin)

export class DBManager {
  private static instances: { [key: string]: PouchDB.Database } = {}
  private static changeListeners: { [key: string]: PouchDB.Core.Changes<object> | null } = {}
  private static syncHandlers: { [key: string]: PouchDB.Replication.Sync<object> | null } = {}
  private static dbConfigs: { [key: string]: DBConfig } = {
    game: {
      name: 'game',
      path: getDataPath('game')
    },
    ['game-collection']: {
      name: 'game-collection',
      path: getDataPath('game-collection')
    },
    ['game-local']: {
      name: 'game-local',
      path: getDataPath('game-local')
    },
    config: {
      name: 'config',
      path: getDataPath('config')
    },
    ['config-local']: {
      name: 'config-local',
      path: getDataPath('config-local')
    }
  }

  static init(): void {
    for (const dbName in this.dbConfigs) {
      this.getInstance(dbName)
    }
  }

  /**
   * 获取数据库实例
   */
  static getInstance(dbName: string): PouchDB.Database {
    if (!this.instances[dbName]) {
      const config = this.dbConfigs[dbName]
      if (!config) {
        throw new Error(`Database ${dbName} not configured`)
      }

      const dbPath = config.path
      this.instances[dbName] = new PouchDB(dbPath, { auto_compaction: true })
      this.startChangeListener(dbName)
      // app.on('before-quit', () => {
      //   this.stopChangeListener(dbName)
      //   this.stopSync(dbName)
      //   this.instances[dbName].close()
      // })
    }
    return this.instances[dbName]
  }

  static async setValue(dbName: string, docId: string, path: string, value: any): Promise<void> {
    const db = this.getInstance(dbName)

    try {
      if (docId === '#all' && path === '#all') {
        await this.setAllDocs(dbName, Object.values(value))
        return
      }
      await db.upsert(docId, (doc: any) => {
        // 对于新建文档，doc 将是一个空对象，只包含 _id
        if (path === '#all') {
          if (value == '#delete') {
            return { _id: docId, _deleted: true }
          }
          // 保留 _id 和 _rev (如果存在)
          return {
            ...doc,
            ...value
          }
        } else {
          // 使用 setValueByPath 更新指定路径的值
          setValueByPath(doc, path, value)
          return doc
        }
      })
    } catch (error) {
      console.error('Error setting value with upsert:', error)
      throw error
    }
  }

  static async getValue<T>(
    dbName: string,
    docId: string,
    path: string,
    defaultValue: T
  ): Promise<T> {
    const db = this.getInstance(dbName)

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
            // 直接使用新版 setValueByPath
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

      // 直接使用新版 getValueByPath
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

  static async removeDoc(dbName: string, docId: string): Promise<void> {
    const db = this.getInstance(dbName)

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

  static async getAllDocs(dbName: string): Promise<Record<string, any>> {
    const db = this.getInstance(dbName)
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

  static async setAllDocs(dbName: string, docs: any[]): Promise<void> {
    const db = this.getInstance(dbName)
    await db.bulkDocs(docs)
  }

  /**
   * 同步所有配置的数据库
   */
  static async syncAllWithRemote(
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions = {}
  ): Promise<void> {
    // 停止所有现有同步
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }

    // 同步每个数据库
    for (const dbName in this.dbConfigs) {
      await this.syncWithRemote(dbName, remoteUrl, options)
    }
  }

  /**
   * 同步单个数据库
   */
  static async syncWithRemote(
    dbName: string,
    remoteUrl: string = 'http://localhost:5984',
    options: SyncOptions = {}
  ): Promise<void> {
    if (dbName.includes('local')) {
      return
    }
    const localDb = this.getInstance(dbName)
    const { auth } = options

    const remoteDbName = `vnite-userdb-${auth?.username}-${dbName}`

    // 构建远程数据库URL
    const remoteDbUrl = `${remoteUrl}/${remoteDbName}`

    const remoteDb = new PouchDB(remoteDbUrl, {
      skip_setup: false,
      auth: auth
    })

    // 停止现有同步
    if (this.syncHandlers[dbName]) {
      this.syncHandlers[dbName].cancel()
    }

    try {
      // 尝试创建远程数据库
      if (auth) {
        try {
          await fetch(`${remoteUrl}/${remoteDbName}`, {
            method: 'PUT',
            headers: {
              Authorization: 'Basic ' + btoa(`${auth.username}:${auth.password}`)
            }
          })
        } catch (err) {
          console.log('Database might already exist or creation failed:', err)
          throw err
        }
      }

      // 设置同步
      this.syncHandlers[dbName] = localDb
        .sync(remoteDb, {
          live: true,
          retry: true
        })
        .on('change', (info) => {
          console.log(`[${dbName}] sync change:`, info)
          this.updateSyncStatus({
            status: 'syncing',
            message: 'Syncing...',
            timestamp: new Date().toISOString()
          })
        })
        .on('paused', () => {
          console.log(`[${dbName}] sync paused`)
          this.updateSyncStatus({
            status: 'success',
            message: 'Sync paused',
            timestamp: new Date().toISOString()
          })
        })
        .on('active', () => {
          console.log(`[${dbName}] sync resumed`)
          this.updateSyncStatus({
            status: 'syncing',
            message: 'Syncing...',
            timestamp: new Date().toISOString()
          })
        })
        .on('denied', (err) => {
          console.error(`[${dbName}] sync denied:`, err)
          this.updateSyncStatus({
            status: 'error',
            message: 'Sync denied',
            timestamp: new Date().toISOString()
          })
        })
        .on('error', (err) => {
          console.error(`[${dbName}] sync error:`, err)
          this.updateSyncStatus({
            status: 'error',
            message: 'Sync error',
            timestamp: new Date().toISOString()
          })
        })
    } catch (error) {
      console.error(`[${dbName}] 同步设置失败:`, error)
      throw error
    }
  }

  static updateSyncStatus(status: SyncStatus): void {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    mainWindow.webContents.send('cloud-sync-status', status)
  }

  /**
   * 停止所有同步
   */
  static stopAllSync(): void {
    for (const dbName in this.syncHandlers) {
      this.stopSync(dbName)
    }
  }

  /**
   * 停止特定数据库的同步
   */
  static stopSync(dbName: string): void {
    if (this.syncHandlers[dbName]) {
      this.syncHandlers[dbName].cancel()
      delete this.syncHandlers[dbName]
    }
  }

  static async putAttachment(
    dbName: string,
    docId: string,
    attachmentId: string,
    attachment: Buffer | string,
    type?: string
  ): Promise<void> {
    const db = this.getInstance(dbName)

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
        await db.putAttachment(docId, attachmentId, doc._rev, attachment, type)
      } else {
        // 文档不存在，创建新文档并添加附件
        await db.put({
          _id: docId,
          _attachments: {
            [attachmentId]: {
              content_type: type,
              data: attachment
            }
          }
        })
      }
      const mainWindow = BrowserWindow.getAllWindows()[0]
      mainWindow.webContents.send('attachment-changed', {
        dbName,
        docId,
        attachmentId: attachmentId,
        timestamp: Date.now()
      } as AttachmentChange)
    } catch (error) {
      console.error('Error putting attachment:', error)
      throw error
    }
  }

  static async getAttachment<
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
    const db = this.getInstance(dbName)

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

  static async checkAttachment(
    dbName: string,
    docId: string,
    attachmentId: string
  ): Promise<boolean> {
    const db = this.getInstance(dbName)

    try {
      const doc = await db.get(docId)
      return !!doc._attachments?.[attachmentId]
    } catch (error) {
      console.error('Error checking attachment:', error)
      throw error
    }
  }

  static async removeAttachment(
    dbName: string,
    docId: string,
    attachmentId: string
  ): Promise<void> {
    const db = this.getInstance(dbName)

    try {
      const doc = await db.get(docId)
      await db.removeAttachment(docId, attachmentId, doc._rev)
    } catch (error) {
      console.error('Error removing attachment:', error)
      throw error
    }
  }

  static async destroyDatabase(dbName: string): Promise<void> {
    if (this.instances[dbName]) {
      this.stopChangeListener(dbName)
      this.stopSync(dbName)
      await this.instances[dbName].destroy()
      delete this.instances[dbName]
    }
  }

  static startChangeListener(dbName: string): void {
    if (this.changeListeners[dbName]) {
      this.stopChangeListener(dbName)
    }

    const mainWindow = BrowserWindow.getAllWindows()[0]
    const db = this.getInstance(dbName)

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

          // 发送文档级别的变化
          mainWindow.webContents.send('db-changed', {
            dbName,
            docId,
            data: { _id: docId, ...data },
            timestamp: Date.now()
          } as DocChange)

          console.log('Database change:', dbName, docId, data)
        } catch (error) {
          console.error('Error handling database change:', error)
        }
      })
  }

  static stopChangeListener(dbName: string): void {
    if (this.changeListeners[dbName]) {
      this.changeListeners[dbName].cancel()
      delete this.changeListeners[dbName]
    }
  }
}

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
import { convertBufferToFile, convertFileToBuffer, convertBufferToTempFile } from '~/utils'
import { fileTypeFromBuffer } from 'file-type'
import { getDataPath } from '~/utils'

export class DBManager {
  private static instances: { [key: string]: PouchDB.Database } = {}
  private static changeListeners: { [key: string]: PouchDB.Core.Changes<object> | null } = {}
  private static syncHandlers: { [key: string]: PouchDB.Replication.Sync<object> | null } = {}
  private static dbConfigs: { [key: string]: DBConfig } = {
    game: {
      name: 'game',
      path: getDataPath('game')
    },
    config: {
      name: 'config',
      path: getDataPath('config')
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
      this.instances[dbName] = new PouchDB(dbPath)
      this.startChangeListener(dbName)
    }
    return this.instances[dbName]
  }

  private static getNestedValue(obj: any, path: string[]): any {
    let current = obj

    // 遍历路径，无则返回undefined
    for (const key of path) {
      if (current === undefined || current === null) {
        return undefined
      }
      current = current[key]
    }

    if (current === undefined || current === null) {
      return undefined
    }

    return current
  }

  private static setNestedValue(obj: any, path: string[], value: any): void {
    let current = obj

    // 遍历路径，除了最后一个
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i]

      // 如果当前节点不存在或为null，创建新对象
      if (current === undefined || current === null) {
        current = {}
      }

      // 如果key不存在，创建新对象
      if (!(key in current)) {
        current[key] = {}
      }

      current = current[key]
    }

    // 设置最后一个路径的值
    const lastKey = path[path.length - 1]
    if (current === undefined || current === null) {
      current = {}
    }
    current[lastKey] = value
  }

  static async setValue(dbName: string, docId: string, path: string[], value: any): Promise<void> {
    const db = this.getInstance(dbName)

    try {
      // 尝试获取现有文档
      let doc: any
      try {
        doc = await db.get(docId)
      } catch (err: any) {
        // 如果文档不存在，创建新文档
        if (err.name === 'not_found') {
          doc = { _id: docId }
        } else {
          throw err
        }
      }

      // 如果path是['#all']，则更新整个文档内容
      if (path[0] === '#all') {
        doc = {
          _id: docId,
          _rev: doc._rev, // 保留revision
          ...value
        }
      } else {
        // 否则更新指定路径的值
        this.setNestedValue(doc, path, value)
      }

      // 保存更新后的文档
      await db.put(doc)
    } catch (error) {
      console.error('Error setting value:', error)
      throw error
    }
  }

  static async getValue<T>(
    dbName: string,
    docId: string,
    path: string[],
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
          if (path[0] === '#all') {
            doc = {
              _id: docId,
              ...(defaultValue as object)
            }
          } else {
            // 使用修改后的setNestedValue来设置默认值
            this.setNestedValue(doc, path, defaultValue)
          }
          await db.put(doc)
          return defaultValue
        }
        throw err
      }

      if (path[0] === '#all') {
        const { _id, _rev, ...rest } = doc
        return rest as T
      }

      // 使用修改后的getNestedValue来获取值
      const value = this.getNestedValue(doc, path)
      if (value === undefined) {
        // 如果返回了undefined，说明路径不存在，需要更新文档
        await this.setValue(dbName, docId, path, defaultValue)
        return defaultValue
      }

      return value as T
    } catch (error) {
      console.error('Error getting value:', error)
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
    const localDb = this.getInstance(dbName)
    const { excludePaths, auth } = options

    const dbExcludePaths = excludePaths?.[dbName] || []

    const remoteDbName = `${auth?.username}-${dbName}`

    // 构建远程数据库URL
    let remoteDbUrl = `${remoteUrl}/${remoteDbName}`
    if (auth) {
      const { username, password } = auth
      const urlObj = new URL(remoteDbUrl)
      urlObj.username = username
      urlObj.password = password
      remoteDbUrl = urlObj.toString()
    }

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
        }
      }

      // 创建过滤函数
      const filterFunction = (doc: any): boolean => {
        if (!dbExcludePaths || dbExcludePaths.length === 0) {
          return true
        }

        const filteredDoc = JSON.parse(JSON.stringify(doc))

        // 获取适用于当前文档的排除规则
        const applicablePaths = dbExcludePaths.filter((exclude) => {
          // 检查是否为全局排除规则
          if (exclude.docId === '#all') {
            return true
          }
          // 检查是否为特定文档的规则
          if (exclude.docId && exclude.docId !== doc._id) {
            return false
          }
          // 检查条件
          if (exclude.condition && !exclude.condition(doc)) {
            return false
          }
          return true
        })

        if (applicablePaths.length === 0) {
          return true
        }

        // 检查是否有需要排除整个文档的规则
        const shouldExcludeEntireDoc = applicablePaths.some(({ path }) => path[0] === '#all')

        if (shouldExcludeEntireDoc) {
          return false // 排除整个文档
        }

        // 应用排除规则
        for (const { path } of applicablePaths) {
          let current = filteredDoc
          for (let i = 0; i < path.length - 1; i++) {
            if (current === undefined || current === null) break
            current = current[path[i]]
          }

          if (current && typeof current === 'object') {
            const lastKey = path[path.length - 1]
            delete current[lastKey]
          }
        }

        return JSON.stringify(doc) === JSON.stringify(filteredDoc)
      }

      if (dbExcludePaths.length > 0) {
        const filterName = `${dbName}_filter`
        const designDocId = `_design/${dbName}_filters` // 为每个数据库创建独立的设计文档

        // 尝试获取现有的设计文档
        try {
          const existingDoc = await localDb.get(designDocId)
          await localDb.put({
            _id: designDocId,
            _rev: existingDoc._rev,
            filters: {
              [filterName]: filterFunction.toString()
            }
          })
        } catch (err: any) {
          if (err.name === 'not_found') {
            // 如果设计文档不存在，创建新的
            await localDb.put({
              _id: designDocId,
              filters: {
                [filterName]: filterFunction.toString()
              }
            })
          } else {
            throw err
          }
        }
      }

      // 设置同步
      this.syncHandlers[dbName] = localDb
        .sync(remoteDb, {
          live: true,
          retry: true,
          filter: dbExcludePaths.length > 0 ? `${dbName}_filters/${dbName}_filter` : undefined
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

  private static updateSyncStatus(status: SyncStatus): void {
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

          const { _id: docId, _rev, _attachments, ...data } = change.doc

          // 发送文档级别的变化
          mainWindow.webContents.send('db-changed', {
            dbName,
            docId,
            data,
            timestamp: Date.now()
          } as DocChange)

          // 如果有附件变化,发送附件变化事件
          if (_attachments) {
            mainWindow.webContents.send('attachment-changed', {
              dbName,
              docId,
              attachments: Object.keys(_attachments),
              timestamp: Date.now()
            } as AttachmentChange)
          }
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

import { createClient, WebDAVClient, ResponseDataDetailed, FileStat } from 'webdav'
import { getDataPath, zipFolder, unzipFile, getAppTempPath } from '~/utils'
import { BrowserWindow, app } from 'electron'
import path from 'path'
import crypto from 'crypto'
import fse from 'fs-extra'
import os from 'os'

export interface CloudSyncConfig {
  webdavUrl: string
  username: string
  password: string
  remotePath: string
  syncInterval: number
}

interface GetLatestModifiedTimeOptions {
  maxDepth?: number
  ignore?: string[]
  followSymlinks?: boolean
}

// 修改元数据接口
export interface SyncMetadata {
  version: string
  timestamp: string
  devices: Array<{
    id: string
    name: string
    lastSync: string
    platform: string
  }>
  checksum: string
  lastModified: string
}

export interface SyncStatus {
  status: 'syncing' | 'success' | 'error'
  message: string
  timestamp: string
}

/**
 * Setup cloud sync
 * @param config
 * @param mainWindow
 * @returns CloudSync
 */
export async function setupCloudSync(
  config: CloudSyncConfig,
  mainWindow: BrowserWindow
): Promise<CloudSync> {
  const cloudSync = new CloudSync(config, mainWindow)
  await cloudSync.initialize()
  return cloudSync
}

/**
 * CloudSync class
 * @class CloudSync
 * @constructor CloudSync
 * @param config
 * @param mainWindow
 * @returns CloudSync
 */
export class CloudSync {
  private client: WebDAVClient
  private deviceId!: string
  private config: CloudSyncConfig
  private mainWindow: BrowserWindow
  private static readonly DEVICE_ID_FILE = 'device-id.json'
  private isNewDevice: boolean = false

  constructor(config: CloudSyncConfig, mainWindow: BrowserWindow) {
    this.config = config
    this.client = createClient(config.webdavUrl, {
      username: config.username,
      password: config.password
    })
    this.mainWindow = mainWindow
  }

  /**
   * Initialize cloud sync service
   * @returns void
   */
  async initialize(): Promise<void> {
    try {
      // 1. Check device ID
      const deviceIdPath = await getDataPath(CloudSync.DEVICE_ID_FILE)
      const deviceIdExists = await fse.pathExists(deviceIdPath)

      // 2. Check remote metadata
      const remoteMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      const remoteExists = await this.client.exists(remoteMetadataPath)

      if (remoteExists) {
        // Remote metadata exists
        const remoteMetadata = await this.getRemoteJson<SyncMetadata>(remoteMetadataPath)

        if (!deviceIdExists) {
          // Device ID does not exist locally, create a new one
          this.deviceId = crypto.randomUUID()
          await fse.writeJson(deviceIdPath, { deviceId: this.deviceId }, { spaces: 2 })
          this.isNewDevice = true
        } else {
          // Use existing device ID
          const localData = await fse.readJson(deviceIdPath)
          this.deviceId = localData.deviceId

          // Check if the device exists in the remote metadata
          const deviceExists = remoteMetadata.devices.some((device) => device.id === this.deviceId)
          if (!deviceExists) {
            this.isNewDevice = true
          }
        }
      } else {
        // Remote metadata does not exist
        if (!deviceIdExists) {
          // Device ID does not exist locally, create a new one
          this.deviceId = crypto.randomUUID()
          await fse.writeJson(deviceIdPath, { deviceId: this.deviceId }, { spaces: 2 })
        } else {
          // Use existing device ID
          const localData = await fse.readJson(deviceIdPath)
          this.deviceId = localData.deviceId
        }
      }

      // If it's a new device, perform initial sync
      if (this.isNewDevice) {
        await this.initialSync()
      }
    } catch (error) {
      console.error('Failed to initialize cloud sync:', error)
      throw error
    }
  }

  /**
   * Initialize cloud sync
   * @returns void
   */
  private async initialSync(): Promise<void> {
    try {
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在进行首次同步...',
        timestamp: new Date().toISOString()
      })

      const remoteMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      const remoteExists = await this.client.exists(remoteMetadataPath)

      if (remoteExists) {
        // Get remote metadata
        const remoteMetadata = await this.getRemoteJson<SyncMetadata>(remoteMetadataPath)

        // Update metadata with device information
        await this.updateMetadata(remoteMetadata)

        // If remote data exists, download it
        await this.downloadDatabase()
      } else {
        // If remote data does not exist, upload local data
        const dataPath = await getDataPath('')
        const checksum = await this.calculateFileChecksum(dataPath)

        const metadata: SyncMetadata = {
          version: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          devices: [],
          checksum,
          lastModified: (await fse.stat(dataPath)).mtime.toISOString()
        }

        await this.updateMetadata(metadata)
        await this.uploadDatabase()
      }

      this.updateSyncStatus({
        status: 'success',
        message: '首次同步完成',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Initial sync failed:', error)
      this.updateSyncStatus({
        status: 'error',
        message: `首次同步失败: ${error}`,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  /**
   * Get device information
   * @returns device information
   */
  private async getDeviceInfo(): Promise<{
    id: string
    name: string
    platform: string
    lastSync: string
  }> {
    return {
      id: this.deviceId,
      name: os.hostname(),
      platform: process.platform,
      lastSync: new Date().toISOString()
    }
  }

  /**
   * Update metadata
   * @param metadata
   * @returns void
   */
  private async updateMetadata(metadata: SyncMetadata): Promise<void> {
    const deviceInfo = await this.getDeviceInfo()

    // Update device information
    const deviceIndex = metadata.devices.findIndex((device) => device.id === this.deviceId)
    if (deviceIndex >= 0) {
      metadata.devices[deviceIndex] = deviceInfo
    } else {
      metadata.devices.push(deviceInfo)
    }

    // Update timestamp
    metadata.timestamp = new Date().toISOString()

    // Update metadata file
    await this.putJson(this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json'), metadata)
  }

  /**
   * Upload database
   * @returns void
   */
  async uploadDatabase(): Promise<void> {
    let tempZipPath = path.join(getAppTempPath(), `vnite-backup-${Date.now()}`)

    try {
      // 1. Stop file watcher
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在上传数据库...',
        timestamp: new Date().toISOString()
      })

      // 2. Ensure temp directory
      await fse.ensureDir(path.dirname(tempZipPath))

      // 3. Zip database
      const dataPath = await getDataPath('')
      await zipFolder(dataPath, tempZipPath, 'vnite-database', {
        exclude: ['path.json', 'device-id.json']
      })

      tempZipPath = path.join(tempZipPath, 'vnite-database.zip')

      // 4. Calculate checksum
      const checksum = await this.calculateFileChecksum(tempZipPath)

      // 5. Create metadata
      const metadata: SyncMetadata = {
        version: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        devices: [], // 将在 updateMetadata 中更新
        checksum,
        lastModified: (await fse.stat(dataPath)).mtime.toISOString()
      }

      // If metadata file exists, keep existing device information
      const mainMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      if (await this.client.exists(mainMetadataPath)) {
        const existingMetadata = await this.getRemoteJson<SyncMetadata>(mainMetadataPath)
        metadata.devices = existingMetadata.devices
      }

      // Update device information in metadata
      await this.updateMetadata(metadata)

      await this.ensureRemoteDirectory()

      // 6. Check if main backup exists, if so, rename it to history
      const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '')
      const mainBackupPath = this.normalizeWebDAVPath(this.config.remotePath, 'database.zip')

      if (await this.client.exists(mainBackupPath)) {
        // Rename existing main backup to history
        await this.client.moveFile(
          mainBackupPath,
          this.normalizeWebDAVPath(this.config.remotePath, `database-${timestamp}.zip`)
        )
      }

      // 7. Upload new main backup
      const zipContent = await fse.readFile(tempZipPath)
      await this.putFileContents(mainBackupPath, zipContent)

      // 9. Cleanup old versions
      await this.cleanupOldVersions()

      this.updateSyncStatus({
        status: 'success',
        message: '数据库上传成功',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Upload failed:', error)
      this.updateSyncStatus({
        status: 'error',
        message: `上传失败: ${error}`,
        timestamp: new Date().toISOString()
      })
      throw error
    } finally {
      // Cleanup temp files
      await fse.remove(tempZipPath).catch(console.error)
    }
  }

  /**
   * Get directory files
   */
  private async getDirectoryFiles(remotePath: string): Promise<FileStat[]> {
    const response = await this.client.getDirectoryContents(remotePath)

    // Handling different response types
    if (Array.isArray(response)) {
      return response
    } else if (response && typeof response === 'object' && 'data' in response) {
      return (response as ResponseDataDetailed<FileStat[]>).data
    }

    throw new Error('Unexpected response format from WebDAV server')
  }

  /**
   * Cleanup old versions
   * Keep only the backups from the last 7 days
   * @returns void
   */
  private async cleanupOldVersions(): Promise<void> {
    try {
      // Get all files in the directory
      const files = await this.getDirectoryFiles(this.config.remotePath)

      // Filter out historical versions of files and sort them by date and time
      const historyFiles = files
        .filter(
          (file) =>
            typeof file.basename === 'string' &&
            file.basename.startsWith('database-') &&
            file.basename.endsWith('.zip')
        )
        .map((file) => {
          try {
            // 使用正则表达式匹配日期和时间部分
            const match = file.basename.match(
              /database-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})\.zip/
            )

            if (!match) {
              console.warn(`Filename does not match expected format: ${file.basename}`)
              return null
            }

            // 解构匹配结果
            const [_, year, month, day, hour, minute, second] = match

            // 构建标准的日期时间字符串
            const dateStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`
            const date = new Date(dateStr)

            if (isNaN(date.getTime())) {
              console.warn(`Invalid date components in filename: ${file.basename}`)
              return null
            }

            return {
              basename: file.basename,
              date: date,
              dateString: `${year}-${month}-${day}`
            }
          } catch (err) {
            console.warn(`Error parsing date from filename: ${file.basename}`, err)
            return null
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => b.date.getTime() - a.date.getTime())

      // Get the date 7 days ago
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Group files by date
      const filesByDate = new Map<string, typeof historyFiles>()
      historyFiles.forEach((file) => {
        if (!filesByDate.has(file.dateString)) {
          filesByDate.set(file.dateString, [])
        }
        filesByDate.get(file.dateString)!.push(file)
      })

      // Collection of files to keep
      const filesToKeep = new Set<string>()

      // Keep only files from the last 7 days
      filesByDate.forEach((dailyFiles, dateString) => {
        if (new Date(dateString) >= sevenDaysAgo) {
          // Keep the latest backup for each day within the 7-day period
          filesToKeep.add(dailyFiles[0].basename)
        }
      })

      // Delete files that are not in the keep list
      for (const file of historyFiles) {
        if (!filesToKeep.has(file.basename)) {
          try {
            await this.client.deleteFile(
              this.normalizeWebDAVPath(this.config.remotePath, file.basename)
            )
            console.log(`Deleted old version: ${file.basename}`)
          } catch (error) {
            console.error(`Failed to delete old version: ${file.basename}`, error)
          }
        }
      }

      // Log retention information
      console.log('Retained backups:', {
        total: filesToKeep.size,
        retainedDays: filesByDate.size,
        oldestRetainedDate: sevenDaysAgo.toISOString().split('T')[0],
        files: Array.from(filesToKeep)
      })
    } catch (error) {
      console.error('Failed to cleanup old versions:', error)
      throw error
    }
  }

  /**
   * Get backup list
   * @returns backup list
   */
  async getBackupList(): Promise<{
    main: SyncMetadata
    history: { filename: string; timestamp: string }[]
  }> {
    try {
      // Get primary backup metadata
      const mainMetadata = await this.getRemoteJson<SyncMetadata>(
        this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      )

      // Get the list of historical versions
      const files = await this.getDirectoryFiles(this.config.remotePath)
      const historyFiles = files
        .filter(
          (file) =>
            typeof file.basename === 'string' &&
            file.basename.startsWith('database-') &&
            file.basename.endsWith('.zip')
        )
        .map((file) => {
          const dateStr = file.basename.replace('database-', '').replace('.zip', '')
          return {
            filename: file.basename,
            timestamp: new Date(dateStr).toISOString()
          }
        })
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

      return {
        main: mainMetadata,
        history: historyFiles
      }
    } catch (error) {
      console.error('Failed to get backup list:', error)
      throw error
    }
  }

  /**
   * Restore history version
   * @param filename
   * @returns Promise<void>
   */
  async restoreHistoryVersion(filename: string): Promise<void> {
    const tempZipPath = path.join(getAppTempPath(), `vnite-restore-${Date.now()}.zip`)

    try {
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在准备恢复历史版本...',
        timestamp: new Date().toISOString()
      })

      // Download historical versions
      const zipContent = await this.client.getFileContents(
        this.normalizeWebDAVPath(this.config.remotePath, filename)
      )

      const zipBuffer = Buffer.isBuffer(zipContent) ? zipContent : Buffer.from(zipContent as any)
      await fse.writeFile(tempZipPath, zipBuffer)

      // Create a backup of the current version
      const dataPath = await getDataPath('')
      const backupPath = path.join(app.getPath('userData'), 'backups', `backup-${Date.now()}`)
      await fse.copy(dataPath, backupPath)

      // Restore Historical Versions
      await unzipFile(tempZipPath, dataPath)

      this.updateSyncStatus({
        status: 'success',
        message: '历史版本恢复成功，即将重启应用...',
        timestamp: new Date().toISOString()
      })

      // Restart the application
      setTimeout(() => {
        app.relaunch()
        app.exit(0)
      }, 1500)
    } catch (error) {
      console.error('Restore failed:', error)
      this.updateSyncStatus({
        status: 'error',
        message: `恢复失败: ${error}`,
        timestamp: new Date().toISOString()
      })
      throw error
    } finally {
      await fse.remove(tempZipPath).catch(console.error)
    }
  }

  /**
   * Get remote JSON data
   * @param remotePath
   * @returns Promise<T>
   */
  private async getRemoteJson<T>(remotePath: string): Promise<T> {
    const response = await this.client.getFileContents(remotePath, { format: 'text' })

    // Handling different response types
    if (typeof response === 'string') {
      return JSON.parse(response)
    } else if (Buffer.isBuffer(response)) {
      return JSON.parse(response.toString('utf-8'))
    } else if ((response as ResponseDataDetailed<any>).data) {
      const data = (response as ResponseDataDetailed<any>).data
      if (typeof data === 'string') {
        return JSON.parse(data)
      } else if (Buffer.isBuffer(data)) {
        return JSON.parse(data.toString('utf-8'))
      }
    }
    throw new Error('Unexpected response format from WebDAV server')
  }

  /**
   * Download database and restore
   * @returns Promise<void>
   */
  async downloadDatabase(): Promise<void> {
    const tempZipPath = path.join(getAppTempPath(), `vnite-download-${Date.now()}.zip`)

    try {
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在准备下载数据库...',
        timestamp: new Date().toISOString()
      })

      // Getting metadata
      const metadata = await this.getRemoteJson<SyncMetadata>(
        this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      )

      // Download database files
      const zipContent = await this.client.getFileContents(
        this.normalizeWebDAVPath(this.config.remotePath, 'database.zip')
      )

      // Handling different response types
      const zipBuffer = Buffer.isBuffer(zipContent) ? zipContent : Buffer.from(zipContent as any)

      await fse.writeFile(tempZipPath, zipBuffer)

      // verify a checksum
      const checksum = await this.calculateFileChecksum(tempZipPath)
      if (checksum !== metadata.checksum) {
        throw new Error('校验和验证失败，文件可能已损坏')
      }

      // Creating a Backup
      const dataPath = await getDataPath('')
      const backupPath = path.join(getAppTempPath(), 'backups', `backup-${Date.now()}`)
      await fse.copy(dataPath, backupPath)

      // Unzip and restore the database
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在恢复数据库...',
        timestamp: new Date().toISOString()
      })

      await unzipFile(tempZipPath, dataPath)

      this.updateSyncStatus({
        status: 'success',
        message: '数据库恢复成功，即将重启应用...',
        timestamp: new Date().toISOString()
      })

      // Restart the application
      setTimeout(() => {
        app.relaunch()
        app.exit(0)
      }, 1500)
    } catch (error) {
      console.error('Download failed:', error)
      this.updateSyncStatus({
        status: 'error',
        message: `下载失败: ${error}`,
        timestamp: new Date().toISOString()
      })
      throw error
    } finally {
      // Cleaning up temporary files
      await fse.remove(tempZipPath).catch(console.error)
    }
  }

  /**
   * Get latest modified time
   * @param dirPath
   * @param currentDepth
   * @param options
   * @returns Promise<number>
   */
  async getLatestModifiedTime(
    dirPath: string,
    currentDepth: number = 0,
    options: GetLatestModifiedTimeOptions = {}
  ): Promise<number> {
    const {
      maxDepth = 3,
      ignore = ['.git', 'node_modules', '.DS_Store'],
      followSymlinks = false
    } = options

    if (currentDepth > maxDepth) {
      return 0
    }

    try {
      const entries = await fse.readdir(dirPath, { withFileTypes: true })
      let latestTime = (await fse.stat(dirPath)).mtime.getTime()

      for (const entry of entries) {
        // 忽略指定的文件和目录
        if (ignore.includes(entry.name)) {
          continue
        }

        const fullPath = path.join(dirPath, entry.name)
        const stats = await fse.stat(fullPath)

        if (entry.isDirectory() || (followSymlinks && entry.isSymbolicLink())) {
          const subdirLatestTime = await this.getLatestModifiedTime(
            fullPath,
            currentDepth + 1,
            options
          )
          latestTime = Math.max(latestTime, subdirLatestTime)
        } else if (entry.isFile()) {
          latestTime = Math.max(latestTime, stats.mtime.getTime())
        }
      }

      return latestTime
    } catch (error) {
      console.error(`Error getting latest modified time for ${dirPath}:`, error)
      return 0
    }
  }

  /**
   * Sync database
   * @returns Promise<void>
   */
  async sync(): Promise<void> {
    try {
      const remoteMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      const remoteExists = await this.client.exists(remoteMetadataPath)

      if (!remoteExists) {
        await this.uploadDatabase()
        return
      }

      // Getting remote metadata
      const remoteMetadata = await this.getRemoteJson<SyncMetadata>(remoteMetadataPath)

      // Make sure the current device is in the device list
      if (!remoteMetadata.devices.some((device) => device.id === this.deviceId)) {
        // If it's a new device, download the remote data first
        await this.downloadDatabase()
        return
      }

      // Compare local and remote last modification times
      const dataPath = await getDataPath('')
      const localLastModified = await this.getLatestModifiedTime(dataPath, 0, {
        maxDepth: 3,
        ignore: ['.git', 'node_modules', '.DS_Store'],
        followSymlinks: false
      })
      const remoteLastModified = new Date(remoteMetadata.lastModified).getTime()

      if (localLastModified > remoteLastModified) {
        await this.uploadDatabase()
      } else if (localLastModified < remoteLastModified) {
        await this.downloadDatabase()
      } else {
        // Update the last synchronization time of the device even if the data has not changed
        await this.updateMetadata(remoteMetadata)

        this.updateSyncStatus({
          status: 'success',
          message: '数据库已是最新版本',
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }

  /**
   * Normalize WebDAV path
   * @param parts
   * @returns string
   */
  private normalizeWebDAVPath(...parts: string[]): string {
    const normalized =
      '/' +
      parts
        .join('/')
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/^\/+/, '')
        .replace(/\/+$/, '')

    return normalized
  }

  /**
   * Put file contents
   * @param remotePath
   * @param content
   * @returns Promise<void>
   */
  private async putFileContents(remotePath: string, content: Buffer | string): Promise<void> {
    try {
      // Normalization path
      console.log('Uploading file to normalized path:', remotePath)

      // Make sure the parent directory exists
      const parentDir = path.dirname(remotePath)
      if (parentDir !== '/') {
        await this.ensureRemoteDirectory()
      }

      // Trying to upload a file
      await this.client.putFileContents(remotePath, content, {
        overwrite: true,
        onUploadProgress: (progress) => {
          console.log(`Upload progress: ${progress.loaded}/${progress.total} bytes`)
        }
      })
    } catch (error) {
      console.error('Failed to put file contents:', error)
      throw error
    }
  }

  /**
   * Test WebDAV connection
   * @returns Promise<boolean>
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing WebDAV connection...')

      // Test Basic Connections
      const testPath = this.normalizeWebDAVPath(this.config.remotePath, '.test')
      await this.putFileContents(testPath, 'test')
      await this.client.deleteFile(testPath)

      console.log('WebDAV connection test successful')
      return true
    } catch (error) {
      console.error('WebDAV connection test failed:', error)
      return false
    }
  }

  /**
   * Put JSON data
   * @param remotePath
   * @param data
   * @returns Promise<void>
   */
  private async putJson(remotePath: string, data: any): Promise<void> {
    await this.putFileContents(remotePath, JSON.stringify(data))
  }

  /**
   * Calculate file checksum
   * @param filePath
   * @returns Promise<string>
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256')
    const stream = fse.createReadStream(filePath)

    return new Promise((resolve, reject) => {
      stream.on('error', reject)
      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
    })
  }

  /**
   * Ensure remote directory
   * @returns Promise<void>
   */
  private async ensureRemoteDirectory(): Promise<void> {
    await this.client.createDirectory(this.config.remotePath, { recursive: true })
  }

  /**
   * Update sync status
   * @param status
   * @returns void
   */
  private updateSyncStatus(status: SyncStatus): void {
    this.mainWindow.webContents.send('cloud-sync-status', status)
  }
}

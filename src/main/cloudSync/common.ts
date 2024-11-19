import { createClient, WebDAVClient, ResponseDataDetailed, FileStat } from 'webdav'
import { getDataPath, zipFolder, unzipFile, getAppTempPath } from '~/utils'
import { stopWatcher, setupWatcher } from '~/watcher'
import { BrowserWindow, app } from 'electron'
import path from 'path'
import crypto from 'crypto'
import fse from 'fs-extra'
import os from 'os'

// types.ts
export interface CloudSyncConfig {
  webdavUrl: string
  username: string
  password: string
  remotePath: string // 用户自定义的远程路径
}

// 修改元数据接口
export interface SyncMetadata {
  version: string
  timestamp: string
  devices: Array<{
    id: string
    name: string // 设备名称
    lastSync: string // 最后同步时间
    platform: string // 操作系统平台
  }>
  checksum: string
  lastModified: string
}

export interface SyncStatus {
  status: 'syncing' | 'success' | 'error'
  message: string
  timestamp: string
}

// cloudSync.ts

export async function setupCloudSync(
  config: CloudSyncConfig,
  mainWindow: BrowserWindow
): Promise<CloudSync> {
  const cloudSync = new CloudSync(config, mainWindow)
  await cloudSync.initialize()
  return cloudSync
}

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
   * 异步初始化方法
   */
  async initialize(): Promise<void> {
    try {
      // 1. 检查本地设备 ID
      const deviceIdPath = await getDataPath(CloudSync.DEVICE_ID_FILE)
      const deviceIdExists = await fse.pathExists(deviceIdPath)

      // 2. 检查远程元数据
      const remoteMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      const remoteExists = await this.client.exists(remoteMetadataPath)

      if (remoteExists) {
        // 远程存在数据
        const remoteMetadata = await this.getRemoteJson<SyncMetadata>(remoteMetadataPath)

        if (!deviceIdExists) {
          // 本地没有设备 ID，创建新的设备 ID
          this.deviceId = crypto.randomUUID()
          await fse.writeJson(deviceIdPath, { deviceId: this.deviceId }, { spaces: 2 })
          this.isNewDevice = true
        } else {
          // 本地有设备 ID
          const localData = await fse.readJson(deviceIdPath)
          this.deviceId = localData.deviceId

          // 检查设备是否已在远程注册
          const deviceExists = remoteMetadata.devices.some((device) => device.id === this.deviceId)
          if (!deviceExists) {
            this.isNewDevice = true
          }
        }
      } else {
        // 远程不存在数据
        if (!deviceIdExists) {
          // 完全新的开始，创建新的设备 ID
          this.deviceId = crypto.randomUUID()
          await fse.writeJson(deviceIdPath, { deviceId: this.deviceId }, { spaces: 2 })
        } else {
          // 使用现有的设备 ID
          const localData = await fse.readJson(deviceIdPath)
          this.deviceId = localData.deviceId
        }
      }

      // 如果是新设备，立即同步数据
      if (this.isNewDevice) {
        await this.initialSync()
      }
    } catch (error) {
      console.error('Failed to initialize cloud sync:', error)
      throw error
    }
  }

  /**
   * 初始同步
   * 用于新设备的首次同步
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
        // 获取远程元数据
        const remoteMetadata = await this.getRemoteJson<SyncMetadata>(remoteMetadataPath)

        // 更新设备信息到远程元数据
        await this.updateMetadata(remoteMetadata)

        // 如果远程有数据，下载到本地
        await this.downloadDatabase()
      } else {
        // 如果远程没有数据，创建新的元数据并上传本地数据
        const dataPath = await getDataPath('')
        const checksum = await this.calculateFileChecksum(dataPath)

        const metadata: SyncMetadata = {
          version: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          devices: [], // 将在 updateMetadata 中添加当前设备
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
   * 获取当前设备信息
   */
  private async getDeviceInfo(): Promise<{
    id: string
    name: string
    platform: string
    lastSync: string
  }> {
    return {
      id: this.deviceId,
      name: os.hostname(), // 使用系统主机名
      platform: process.platform,
      lastSync: new Date().toISOString()
    }
  }

  /**
   * 更新元数据
   */
  private async updateMetadata(metadata: SyncMetadata): Promise<void> {
    const deviceInfo = await this.getDeviceInfo()

    // 更新设备信息
    const deviceIndex = metadata.devices.findIndex((device) => device.id === this.deviceId)
    if (deviceIndex >= 0) {
      metadata.devices[deviceIndex] = deviceInfo
    } else {
      metadata.devices.push(deviceInfo)
    }

    // 更新时间戳
    metadata.timestamp = new Date().toISOString()

    // 保存更新后的元数据
    await this.putJson(this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json'), metadata)
  }

  /**
   * 上传数据库到WebDAV
   */
  async uploadDatabase(): Promise<void> {
    let tempZipPath = path.join(getAppTempPath(), `vnite-backup-${Date.now()}`)

    try {
      // 1. 停止文件监视
      stopWatcher()
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在准备上传数据库...',
        timestamp: new Date().toISOString()
      })

      // 2. 确保临时目录存在
      await fse.ensureDir(path.dirname(tempZipPath))

      // 3. 压缩数据库文件
      const dataPath = await getDataPath('')
      await zipFolder(dataPath, tempZipPath, 'vnite-database', {
        exclude: ['path.json']
      })

      tempZipPath = path.join(tempZipPath, 'vnite-database.zip')

      // 4. 计算校验和
      const checksum = await this.calculateFileChecksum(tempZipPath)

      // 5. 创建元数据
      const metadata: SyncMetadata = {
        version: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        devices: [], // 将在 updateMetadata 中更新
        checksum,
        lastModified: (await fse.stat(dataPath)).mtime.toISOString()
      }

      // 如果远程已存在元数据，则保留现有的设备列表
      const mainMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      if (await this.client.exists(mainMetadataPath)) {
        const existingMetadata = await this.getRemoteJson<SyncMetadata>(mainMetadataPath)
        metadata.devices = existingMetadata.devices
      }

      // 更新元数据中的设备信息
      await this.updateMetadata(metadata)

      await this.ensureRemoteDirectory()

      // 6. 检查是否存在主备份，如果存在则重命名为历史版本
      const timestamp = new Date().toISOString().replace(/[:]/g, '-').replace(/\..+/, '')
      const mainBackupPath = this.normalizeWebDAVPath(this.config.remotePath, 'database.zip')

      if (await this.client.exists(mainBackupPath)) {
        // 重命名主备份为历史版本，使用完整的时间戳
        await this.client.moveFile(
          mainBackupPath,
          this.normalizeWebDAVPath(this.config.remotePath, `database-${timestamp}.zip`)
        )
      }

      // 7. 上传新的主备份
      const zipContent = await fse.readFile(tempZipPath)
      await this.putFileContents(mainBackupPath, zipContent)

      // 9. 清理旧的历史版本（保留最近7个和30天内）
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
      // 清理临时文件
      await fse.remove(tempZipPath).catch(console.error)
      // 恢复文件监视
      await setupWatcher(this.mainWindow)
    }
  }

  /**
   * 获取目录内容并处理响应
   */
  private async getDirectoryFiles(remotePath: string): Promise<FileStat[]> {
    const response = await this.client.getDirectoryContents(remotePath)

    // 处理不同的响应类型
    if (Array.isArray(response)) {
      return response
    } else if (response && typeof response === 'object' && 'data' in response) {
      return (response as ResponseDataDetailed<FileStat[]>).data
    }

    throw new Error('Unexpected response format from WebDAV server')
  }

  /**
   * 清理旧的历史版本
   * 保留：1. 今天的最近7次备份 2. 30天内每天的备份
   */
  private async cleanupOldVersions(): Promise<void> {
    try {
      // 获取目录下所有文件
      const files = await this.getDirectoryFiles(this.config.remotePath)

      // 筛选出历史版本文件并按日期时间排序
      const historyFiles = files
        .filter(
          (file) =>
            typeof file.basename === 'string' &&
            file.basename.startsWith('database-') &&
            file.basename.endsWith('.zip')
        )
        .map((file) => ({
          basename: file.basename,
          date: new Date(file.basename.replace('database-', '').replace('.zip', '')),
          // 添加日期字符串用于分组
          dateString: new Date(file.basename.replace('database-', '').replace('.zip', ''))
            .toISOString()
            .split('T')[0]
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime())

      // 获取30天前的日期
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // 获取今天的日期字符串
      const today = new Date().toISOString().split('T')[0]

      // 按日期分组
      const filesByDate = new Map<string, typeof historyFiles>()
      historyFiles.forEach((file) => {
        if (!filesByDate.has(file.dateString)) {
          filesByDate.set(file.dateString, [])
        }
        filesByDate.get(file.dateString)!.push(file)
      })

      // 要保留的文件集合
      const filesToKeep = new Set<string>()

      // 处理每一天的文件
      filesByDate.forEach((dailyFiles, dateString) => {
        if (dateString === today) {
          // 今天的文件：保留最近7次
          dailyFiles.slice(0, 7).forEach((file) => {
            filesToKeep.add(file.basename)
          })
        } else if (new Date(dateString) >= thirtyDaysAgo) {
          // 30天内的其他天：每天保留最新的一次备份
          filesToKeep.add(dailyFiles[0].basename)
        }
      })

      // 删除不需要保留的文件
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

      // 打印保留的备份信息
      console.log('Retained backups:', {
        total: filesToKeep.size,
        todayBackups: filesByDate.get(today)?.slice(0, 7).length || 0,
        daysWithinMonth: filesByDate.size
      })
    } catch (error) {
      console.error('Failed to cleanup old versions:', error)
    }
  }

  /**
   * 获取所有备份版本列表
   */
  async getBackupList(): Promise<{
    main: SyncMetadata
    history: { filename: string; timestamp: string }[]
  }> {
    try {
      // 获取主备份元数据
      const mainMetadata = await this.getRemoteJson<SyncMetadata>(
        this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      )

      // 获取历史版本列表
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
   * 恢复指定的历史版本
   */
  async restoreHistoryVersion(filename: string): Promise<void> {
    const tempZipPath = path.join(getAppTempPath(), `vnite-restore-${Date.now()}.zip`)

    try {
      stopWatcher()
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在准备恢复历史版本...',
        timestamp: new Date().toISOString()
      })

      // 下载历史版本
      const zipContent = await this.client.getFileContents(
        this.normalizeWebDAVPath(this.config.remotePath, filename)
      )

      const zipBuffer = Buffer.isBuffer(zipContent) ? zipContent : Buffer.from(zipContent as any)
      await fse.writeFile(tempZipPath, zipBuffer)

      // 创建当前版本的备份
      const dataPath = await getDataPath('')
      const backupPath = path.join(app.getPath('userData'), 'backups', `backup-${Date.now()}`)
      await fse.copy(dataPath, backupPath)

      // 恢复历史版本
      await unzipFile(tempZipPath, dataPath)

      this.updateSyncStatus({
        status: 'success',
        message: '历史版本恢复成功，即将重启应用...',
        timestamp: new Date().toISOString()
      })

      // 重启应用
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
   * 从WebDAV获取文件内容并解析为JSON
   */
  private async getRemoteJson<T>(remotePath: string): Promise<T> {
    const response = await this.client.getFileContents(remotePath, { format: 'text' })

    // 处理不同的响应类型
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
   * 从WebDAV下载并恢复数据库
   */
  async downloadDatabase(): Promise<void> {
    const tempZipPath = path.join(getAppTempPath(), `vnite-download-${Date.now()}.zip`)

    try {
      stopWatcher()
      this.updateSyncStatus({
        status: 'syncing',
        message: '正在准备下载数据库...',
        timestamp: new Date().toISOString()
      })

      // 使用新的getRemoteJson方法获取元数据
      const metadata = await this.getRemoteJson<SyncMetadata>(
        this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      )

      // 下载数据库文件
      const zipContent = await this.client.getFileContents(
        this.normalizeWebDAVPath(this.config.remotePath, 'database.zip')
      )

      // 处理不同的响应类型
      const zipBuffer = Buffer.isBuffer(zipContent) ? zipContent : Buffer.from(zipContent as any)

      await fse.writeFile(tempZipPath, zipBuffer)

      // 4. 验证校验和
      const checksum = await this.calculateFileChecksum(tempZipPath)
      if (checksum !== metadata.checksum) {
        throw new Error('校验和验证失败，文件可能已损坏')
      }

      // 5. 创建备份
      const dataPath = await getDataPath('')
      const backupPath = path.join(getAppTempPath(), 'backups', `backup-${Date.now()}`)
      await fse.copy(dataPath, backupPath)

      // 6. 解压并恢复数据库
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

      // 7. 重启应用
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
      // 8. 清理临时文件
      await fse.remove(tempZipPath).catch(console.error)
    }
  }

  /**
   * 同步方法
   */
  async sync(): Promise<void> {
    try {
      const remoteMetadataPath = this.normalizeWebDAVPath(this.config.remotePath, 'metadata.json')
      const remoteExists = await this.client.exists(remoteMetadataPath)

      if (!remoteExists) {
        await this.uploadDatabase()
        return
      }

      // 获取远程元数据
      const remoteMetadata = await this.getRemoteJson<SyncMetadata>(remoteMetadataPath)

      // 确保当前设备在设备列表中
      if (!remoteMetadata.devices.some((device) => device.id === this.deviceId)) {
        // 如果是新设备，先下载远程数据
        await this.downloadDatabase()
        return
      }

      // 比较本地和远程的最后修改时间
      const dataPath = await getDataPath('')
      const localLastModified = (await fse.stat(dataPath)).mtime.getTime()
      const remoteLastModified = new Date(remoteMetadata.lastModified).getTime()

      if (localLastModified > remoteLastModified) {
        await this.uploadDatabase()
      } else if (localLastModified < remoteLastModified) {
        await this.downloadDatabase()
      } else {
        // 即使数据没有变化，也更新设备的最后同步时间
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
   * 规范化 WebDAV 路径
   */
  private normalizeWebDAVPath(...parts: string[]): string {
    // 1. 合并路径部分
    // 2. 将反斜杠转换为正斜杠
    // 3. 确保路径以正斜杠开头
    // 4. 移除重复的正斜杠
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
   * 上传文件内容
   */
  private async putFileContents(remotePath: string, content: Buffer | string): Promise<void> {
    try {
      // 规范化路径
      console.log('Uploading file to normalized path:', remotePath)

      // 确保父目录存在
      const parentDir = path.dirname(remotePath)
      if (parentDir !== '/') {
        await this.ensureRemoteDirectory()
      }

      // 尝试上传文件
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
   * 测试 WebDAV 连接
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing WebDAV connection...')

      // 测试基本连接
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
   * 上传JSON数据
   */
  private async putJson(remotePath: string, data: any): Promise<void> {
    await this.putFileContents(remotePath, JSON.stringify(data))
  }

  /**
   * 计算文件校验和
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
   * 确保远程目录存在
   */
  private async ensureRemoteDirectory(): Promise<void> {
    await this.client.createDirectory(this.config.remotePath, { recursive: true })
  }

  /**
   * 更新同步状态
   */
  private updateSyncStatus(status: SyncStatus): void {
    this.mainWindow.webContents.send('cloud-sync-status', status)
  }
}

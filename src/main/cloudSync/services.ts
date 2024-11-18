// services.ts
import { BrowserWindow } from 'electron'
import fse from 'fs-extra'
import { CloudSync, setupCloudSync } from './common'
import type { CloudSyncConfig, SyncMetadata } from './common'
import { getDataPath } from '~/utils'

interface AppConfig {
  cloudSync?: {
    enabled: boolean
    config?: CloudSyncConfig
  }
}

// 添加版本列表接口
interface BackupList {
  main: SyncMetadata
  history: { filename: string; timestamp: string }[]
}

export async function initializeCloudsyncServices(): Promise<void> {
  const mainWindow = BrowserWindow.getAllWindows()[0]

  // 初始化云同步服务,等待渲染进程准备好
  setTimeout(async () => {
    await CloudSyncService.setup(mainWindow)
  }, 10000)
}

export class CloudSyncService {
  private static instance: CloudSync | null = null
  private static configPath: string | null = null

  /**
   * 初始化服务配置
   */
  private static async initialize(): Promise<void> {
    if (!this.configPath) {
      this.configPath = await getDataPath('config.json')
    }
  }

  /**
   * 初始化云同步服务
   */
  static async setup(mainWindow: BrowserWindow): Promise<void> {
    try {
      // 确保配置路径已初始化
      await this.initialize()

      const config = await this.getAppConfig()

      if (config.cloudSync?.enabled && config.cloudSync.config) {
        // 验证配置的完整性
        if (this.validateCloudSyncConfig(config.cloudSync.config)) {
          this.instance = await setupCloudSync(config.cloudSync.config, mainWindow)

          // 设置定期同步（每5分钟）
          setInterval(
            () => {
              this.sync().catch(console.error)
            },
            5 * 60 * 1000
          )

          // 首次同步(等待渲染进程准备好)
          setTimeout(() => {
            this.sync().catch(console.error)
          }, 5000)
        } else {
          console.warn('Cloud sync configuration is invalid')
        }
      } else {
        console.log('Cloud sync is not enabled')
      }
    } catch (error) {
      console.error('Failed to setup cloud sync service:', error)
    }
  }

  /**
   * 获取应用配置
   */
  static async getAppConfig(): Promise<AppConfig> {
    try {
      // 确保配置路径已初始化
      await this.initialize()

      if (await fse.pathExists(this.configPath!)) {
        return await fse.readJson(this.configPath!)
      }
      return { cloudSync: { enabled: false } }
    } catch (error) {
      console.error('Failed to read app config:', error)
      return { cloudSync: { enabled: false } }
    }
  }

  /**
   * 保存应用配置
   */
  static async saveAppConfig(config: AppConfig): Promise<void> {
    await this.initialize()
    await fse.writeJson(this.configPath!, config, { spaces: 2 })
  }

  /**
   * 更新云同步配置
   */
  static async updateCloudSyncConfig(mainWindow: BrowserWindow): Promise<void> {
    const appConfig = await this.getAppConfig()
    if (!appConfig.cloudSync) {
      appConfig.cloudSync = { enabled: false }
    } else {
      appConfig.cloudSync.enabled = true
      this.instance = await setupCloudSync(appConfig.cloudSync.config!, mainWindow)
      await this.sync()
    }
  }

  /**
   * 禁用云同步
   */
  static async disable(): Promise<void> {
    const appConfig = await this.getAppConfig()
    appConfig.cloudSync = { enabled: false }
    await this.saveAppConfig(appConfig)
    this.instance = null
  }

  /**
   * 执行同步
   */
  static async sync(): Promise<void> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    await this.instance.sync()
  }

  /**
   * 获取云同步实例
   */
  static getInstance(): CloudSync | null {
    return this.instance
  }

  /**
   * 验证云同步配置
   */
  private static validateCloudSyncConfig(config: CloudSyncConfig): boolean {
    return !!(config.webdavUrl && config.username && config.password && config.remotePath)
  }

  /**
   * 获取备份版本列表
   */
  static async getBackupList(): Promise<BackupList> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    return await this.instance.getBackupList()
  }

  /**
   * 恢复历史版本
   */
  static async restoreHistoryVersion(filename: string): Promise<void> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    await this.instance.restoreHistoryVersion(filename)
  }

  /**
   * 手动触发上传备份
   */
  static async uploadBackup(): Promise<void> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    await this.instance.uploadDatabase()
  }
}

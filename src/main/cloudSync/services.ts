// services.ts
import { BrowserWindow } from 'electron'
import fse from 'fs-extra'
import { CloudSync, setupCloudSync } from './common'
import type { CloudSyncConfig, SyncMetadata } from './common'
import { getDataPath } from '~/utils'
import log from 'electron-log/main.js'

interface AppConfig {
  cloudSync?: {
    enabled: boolean
    config?: CloudSyncConfig
  }
}

interface BackupList {
  main: SyncMetadata
  history: { filename: string; timestamp: string }[]
}

export async function initializeCloudsyncServices(mainWindow: BrowserWindow): Promise<void> {
  // Initialize the cloud synchronization service and wait for the rendering process to be ready.
  setTimeout(async () => {
    await CloudSyncService.setup(mainWindow)
  }, 10000)
}

export class CloudSyncService {
  private static instance: CloudSync | null = null
  private static configPath: string | null = null

  /**
   * Initialize Service Configuration
   * @returns Promise<void>
   */
  private static async initialize(): Promise<void> {
    if (!this.configPath) {
      this.configPath = await getDataPath('config.json')
    }
  }

  /**
   * Initializing the Cloud Sync Service
   * @param mainWindow
   * @returns Promise<void>
   */
  static async setup(mainWindow: BrowserWindow): Promise<void> {
    try {
      // Ensure that the configuration path is initialized
      await this.initialize()

      const config = await this.getAppConfig()

      if (config.cloudSync?.enabled && config.cloudSync.config) {
        // Verify the integrity of the configuration
        if (this.validateCloudSyncConfig(config.cloudSync.config)) {
          this.instance = await setupCloudSync(config.cloudSync.config, mainWindow)

          // Set up periodic synchronization
          setInterval(() => {
            this.sync().catch(console.error)
          }, config.cloudSync.config.syncInterval)

          // First time synchronization (waiting for the rendering process to be ready)
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
      log.error('Failed to setup cloud sync service:', error)
    }
  }

  /**
   * Getting the Application Configuration
   * @returns Promise<AppConfig>
   */
  static async getAppConfig(): Promise<AppConfig> {
    try {
      // Ensure that the configuration path is initialized
      await this.initialize()

      if (await fse.pathExists(this.configPath!)) {
        return await fse.readJson(this.configPath!)
      }
      return { cloudSync: { enabled: false } }
    } catch (error) {
      log.error('Failed to read app config:', error)
      return { cloudSync: { enabled: false } }
    }
  }

  /**
   * Save Application Configuration
   * @param config
   * @returns Promise<void>
   */
  static async saveAppConfig(config: AppConfig): Promise<void> {
    await this.initialize()
    await fse.writeJson(this.configPath!, config, { spaces: 2 })
  }

  /**
   * Updating Cloud Synchronization Configuration
   * @param mainWindow
   * @returns Promise<void>
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
   * Disable cloud synchronization
   * @returns Promise<void>
   */
  static async disable(): Promise<void> {
    const appConfig = await this.getAppConfig()
    appConfig.cloudSync = { enabled: false }
    await this.saveAppConfig(appConfig)
    this.instance = null
  }

  /**
   * Execute a synchronization
   * @returns Promise<void>
   */
  static async sync(): Promise<void> {
    try {
      if (!this.instance) {
        throw new Error('Cloud sync is not initialized')
      }
      await this.instance.sync()
    } catch (error) {
      log.error('Failed to sync cloud:', error)
    }
  }

  /**
   * Getting a Cloud Synchronization Instance
   * @returns CloudSync | null
   */
  static getInstance(): CloudSync | null {
    return this.instance
  }

  /**
   * Verify Cloud Synchronization Configuration
   * @param config
   * @returns boolean
   */
  private static validateCloudSyncConfig(config: CloudSyncConfig): boolean {
    return !!(config.webdavUrl && config.username && config.password && config.remotePath)
  }

  /**
   * Getting a list of backup versions
   * @returns Promise<BackupList>
   */
  static async getBackupList(): Promise<BackupList> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    return await this.instance.getBackupList()
  }

  /**
   * Restore Historical Versions
   * @param filename
   * @returns Promise<void>
   */
  static async restoreHistoryVersion(filename: string): Promise<void> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    await this.instance.restoreHistoryVersion(filename)
  }

  /**
   * Manually triggered upload backups
   * @returns Promise<void>
   */
  static async uploadBackup(): Promise<void> {
    if (!this.instance) {
      throw new Error('Cloud sync is not initialized')
    }
    await this.instance.uploadDatabase()
  }
}

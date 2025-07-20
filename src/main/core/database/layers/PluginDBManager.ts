import { baseDBManager } from '../BaseDBManager'
import log from 'electron-log/main'

export class PluginDBManager {
  private static readonly DB_NAME = 'plugin'

  static async getPluginValue(pluginId: string, key: string, defaultValue: any): Promise<any> {
    try {
      return await baseDBManager.getValue(this.DB_NAME, pluginId, key, defaultValue)
    } catch (error) {
      log.error(`Failed to get plugin value for ${pluginId} with key ${key}:`, error)
      throw new Error(`Failed to get plugin value: ${error}`)
    }
  }

  static async setPluginValue(pluginId: string, key: string, value: any): Promise<void> {
    try {
      await baseDBManager.setValue(this.DB_NAME, pluginId, key, value)
    } catch (error) {
      log.error(`Failed to set plugin value for ${pluginId} with key ${key}:`, error)
      throw new Error(`Failed to set plugin value: ${error}`)
    }
  }

  static async removePlugin(pluginId: string): Promise<void> {
    try {
      await baseDBManager.removeDoc(this.DB_NAME, pluginId)
    } catch (error) {
      log.error(`Failed to remove plugin ${pluginId}:`, error)
      throw new Error(`Failed to remove plugin: ${error}`)
    }
  }
}

/**
 * Core API 全局命名空间
 *
 * 这个文件创建了一个统一的API对象，暴露了所有核心模块的功能。
 * 使用类似 VSCode 扩展API的开发方式，提供统一的访问入口。
 *
 * 注意：这个实现需要与 plugin-sdk 中的类型定义保持一致
 */

// 导入所有核心模块
import { ConfigDBManager, GameDBManager, PluginDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import { ipcManager } from '~/core/ipc'
import { scraperManager } from '~/features/scraper/services/ScraperManager'

// 创建API实例
export class VnitePluginAPI {
  public readonly pluginId: string
  public readonly ConfigDB = ConfigDBManager
  public readonly GameDB = GameDBManager
  public readonly PluginDB: {
    getValue: (key: string, defaultValue?: any) => Promise<any>
    setValue: (key: string, value: any) => Promise<void>
  }
  public readonly eventBus = eventBus
  public readonly ipc = ipcManager
  public readonly scraper = scraperManager

  constructor(pluginId: string) {
    this.pluginId = pluginId
    this.PluginDB = {
      getValue: (key: string, defaultValue?: any): Promise<any> => {
        return PluginDBManager.getPluginValue(this.pluginId, key, defaultValue)
      },
      setValue: (key: string, value: any): Promise<void> => {
        return PluginDBManager.setPluginValue(this.pluginId, key, value)
      }
    }
  }
}

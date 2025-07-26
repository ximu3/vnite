import { ConfigDBManager, GameDBManager, PluginDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import { ipcManager } from '~/core/ipc'
import { scraperManager } from '~/features/scraper/services/ScraperManager'

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

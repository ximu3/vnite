import { ConfigDBManager, GameDBManager } from '~/core/database'
import { EventBus } from '~/core/events'
import { IPCManager } from '~/core/ipc'
import { ScraperManager } from '~/features/scraper/services/ScraperManager'

export interface IPluginAPI {
  /** 插件ID */
  readonly pluginId: string
  /** 配置数据库 */
  readonly ConfigDB: ConfigDBManager
  /** 游戏数据库 */
  readonly GameDB: GameDBManager
  /** 插件专用数据库 */
  readonly PluginDB: {
    getValue: (key: string, defaultValue?: any) => Promise<any>
    setValue: (key: string, value: any) => Promise<void>
  }
  /** 事件总线 */
  readonly eventBus: EventBus
  /** IPC通信 */
  readonly ipc: IPCManager
  /** 刮削器管理器 */
  readonly scraper: ScraperManager
}

export interface IPlugin {
  /** 激活插件 */
  activate(api: IPluginAPI): Promise<void> | void
  /** 停用插件 */
  deactivate?(api: IPluginAPI): Promise<void> | void
}

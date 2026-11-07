import { ConfigDBManager, GameDBManager } from '~/core/database'
import { EventBus } from '~/core/events'
import { IPCManager } from '~/core/ipc'
import { ScraperManager } from '~/features/scraper/services/ScraperManager'
import type { PluginDetailTab } from '@appTypes/plugin/gameDetail'

export interface IPluginAPI {
  readonly pluginId: string
  readonly ConfigDB: ConfigDBManager
  readonly GameDB: GameDBManager
  readonly PluginDB: {
    getValue: (key: string, defaultValue?: any) => Promise<any>
    setValue: (key: string, value: any) => Promise<void>
  }
  readonly eventBus: EventBus
  readonly ipc: IPCManager
  readonly scraper: ScraperManager
  readonly gameDetail: { registerTab(tab: PluginDetailTab): () => void }
}

export interface IPlugin {
  activate(api: IPluginAPI): Promise<void> | void
  deactivate?(api: IPluginAPI): Promise<void> | void
}

import type {
  PluginDetailRequest,
  PluginDetailTab,
  PluginDetailTabInfo,
  PluginDetailView
} from '@appTypes/plugin/gameDetail'
export class GameDetailTabs {
  private tabs = new Map<string, { pluginId: string; tab: PluginDetailTab }>()
  constructor(private readonly onChanged: () => void) {}

  register(pluginId: string, tab: PluginDetailTab): () => void {
    if (
      !/^[a-z0-9_-]{1,64}$/i.test(tab.id) ||
      !tab.title?.trim() ||
      typeof tab.load !== 'function'
    ) {
      throw new Error('Invalid game detail tab')
    }
    const key = `${pluginId}:${tab.id}`
    if (this.tabs.has(key)) throw new Error(`Game detail tab already registered: ${key}`)
    this.tabs.set(key, { pluginId, tab })
    this.changed()
    return () => {
      if (this.tabs.get(key)?.tab === tab) {
        this.tabs.delete(key)
        this.changed()
      }
    }
  }

  removePlugin(pluginId: string): void {
    let removed = false
    for (const [key, entry] of this.tabs)
      if (entry.pluginId === pluginId) {
        this.tabs.delete(key)
        removed = true
      }
    if (removed) this.changed()
  }

  list(): PluginDetailTabInfo[] {
    return [...this.tabs.values()].map(({ pluginId, tab }) => ({
      pluginId,
      id: tab.id,
      title: tab.title
    }))
  }

  async load(
    pluginId: string,
    id: string,
    request: PluginDetailRequest
  ): Promise<PluginDetailView> {
    const tab = this.tabs.get(`${pluginId}:${id}`)?.tab
    if (!tab) throw new Error('Plugin detail tab is no longer available')
    return await tab.load(request)
  }

  async action(
    pluginId: string,
    id: string,
    request: PluginDetailRequest,
    itemId: string,
    actionId: string
  ): Promise<string> {
    const tab = this.tabs.get(`${pluginId}:${id}`)?.tab
    if (!tab?.action) throw new Error('Plugin action is no longer available')
    return await tab.action(request, itemId, actionId)
  }

  private changed(): void {
    this.onChanged()
  }
}

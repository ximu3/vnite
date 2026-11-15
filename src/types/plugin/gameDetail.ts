/** Serializable controls and content for a plugin-provided game detail tab. */
export interface PluginDetailOption {
  value: string
  label: string
}
export interface PluginDetailControl {
  id: string
  label: string
  value: string
  options: PluginDetailOption[]
}
export interface PluginDetailItem {
  id: string
  title: string
  subtitle?: string
  body: string
  badge?: string
  actions?: PluginDetailOption[]
}
export interface PluginDetailView {
  controls?: PluginDetailControl[]
  message?: string
  link?: { label: string; url: string }
  items?: PluginDetailItem[]
  nextCursor?: string
}
export interface PluginDetailRequest {
  gameId: string
  values: Record<string, string>
  cursor?: string
}
export interface PluginDetailTab {
  id: string
  title: string
  load(request: PluginDetailRequest): Promise<PluginDetailView>
  action?(request: PluginDetailRequest, itemId: string, actionId: string): Promise<string>
}
export interface PluginDetailTabInfo {
  pluginId: string
  id: string
  title: string
}

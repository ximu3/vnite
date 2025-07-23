import { create } from 'zustand'
import { ipcManager } from '~/app/ipc'
import { toast } from 'sonner'
import type { PluginInfo, PluginStatsData } from '@appTypes/plugin'

interface PluginInfoStore {
  // 状态
  plugins: PluginInfo[]
  stats: PluginStatsData | null
  loading: boolean

  loadPlugins: () => Promise<void>
  loadStats: () => Promise<void>

  setPlugins: (plugins: PluginInfo[]) => void
  setStats: (stats: PluginStatsData | null) => void

  installPlugin: (
    source: string,
    options?: { autoEnable?: boolean }
  ) => Promise<{ success: boolean; error?: string }>
  installPluginFromFile: () => Promise<void>
  uninstallPlugin: (pluginId: string) => Promise<void>
  togglePlugin: (pluginId: string, activate: boolean) => Promise<void>
  checkUpdates: () => Promise<void>
}

export const usePluginInfoStore = create<PluginInfoStore>((set) => ({
  // 初始状态
  plugins: [],
  stats: null,
  loading: false,

  setPlugins: (plugins) => set({ plugins }),
  setStats: (stats) => set({ stats }),

  // 操作方法
  loadPlugins: async () => {
    set({ loading: true })
    try {
      const result = await ipcManager.invoke('plugin:get-all-plugins')
      set({ plugins: result || [] })
    } catch (error) {
      console.error('获取插件列表失败:', error)
      toast.error('加载插件失败')
    } finally {
      set({ loading: false })
    }
  },

  loadStats: async () => {
    try {
      const result = await ipcManager.invoke('plugin:get-stats')
      set({ stats: result })
    } catch (error) {
      console.error('获取插件统计信息失败:', error)
    }
  },

  installPlugin: async (source, options) => {
    const result = await ipcManager.invoke('plugin:install-plugin', source, options)
    if (result.success) {
      toast.success('插件安装成功')
    } else {
      toast.error(`插件安装失败: ${result.error}`)
    }
    return result
  },

  installPluginFromFile: async () => {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])

      if (!filePath) return

      const result = await ipcManager.invoke('plugin:install-plugin-from-file', filePath, {
        autoEnable: true
      })

      if (result.success) {
        toast.success('插件安装成功')
      } else {
        toast.error(`插件安装失败: ${result.error}`)
      }
    } catch (error) {
      console.error('从文件安装插件失败:', error)
      toast.error('从文件安装插件失败')
    }
  },

  uninstallPlugin: async (pluginId) => {
    const result = await ipcManager.invoke('plugin:uninstall-plugin', pluginId)
    if (result.success) {
      toast.success('插件卸载成功')
    } else {
      toast.error(`插件卸载失败: ${result.error}`)
    }
  },

  togglePlugin: async (pluginId, activate) => {
    const action = activate ? 'plugin:activate-plugin' : 'plugin:deactivate-plugin'
    const result = await ipcManager.invoke(action, pluginId)

    if (result.success) {
      const message = activate ? '插件已激活' : '插件已停用'
      toast.success(message)
    } else {
      const message = activate ? `激活插件失败: ${result.error}` : `停用插件失败: ${result.error}`
      toast.error(message)
    }
  },

  checkUpdates: async () => {
    set({ loading: true })
    try {
      const updates = await ipcManager.invoke('plugin:check-updates')
      if (updates.length > 0) {
        toast.success(`有 ${updates.length} 个更新可用`)
      } else {
        toast.info('没有可用更新')
      }
    } catch (error) {
      console.error('检查更新失败:', error)
      toast.error('检查更新失败')
    } finally {
      set({ loading: false })
    }
  }
}))

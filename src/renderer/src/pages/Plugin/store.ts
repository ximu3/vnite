import { create } from 'zustand'
import { ipcManager } from '~/app/ipc'
import { toast } from 'sonner'
import type {
  PluginInfo,
  PluginStatsData,
  PluginUpdateInfo,
  PluginInstallOptions
} from '@appTypes/plugin'
import i18next from 'i18next'

interface PluginInfoStore {
  plugins: PluginInfo[]
  stats: PluginStatsData | null
  loading: boolean
  updates: PluginUpdateInfo[] | null

  loadPlugins: () => Promise<void>
  loadStats: () => Promise<void>

  setPlugins: (plugins: PluginInfo[]) => void
  setStats: (stats: PluginStatsData | null) => void
  setUpdates: (updates: PluginUpdateInfo[] | null) => void

  installPlugin: (
    source: string,
    options?: PluginInstallOptions,
    pluginName?: string
  ) => Promise<{ success: boolean; error?: string }>
  installPluginFromFile: () => Promise<void>
  uninstallPlugin: (pluginId: string, pluginName: string) => Promise<void>
  togglePlugin: (pluginId: string, activate: boolean) => Promise<void>
  checkUpdates: (noToast?: boolean) => Promise<void>
}

export const usePluginInfoStore = create<PluginInfoStore>((set) => ({
  plugins: [],
  stats: null,
  loading: false,
  updates: null,

  setPlugins: (plugins) => set({ plugins }),
  setStats: (stats) => set({ stats }),
  setUpdates: (updates) => set({ updates }),

  loadPlugins: async () => {
    set({ loading: true })
    try {
      const result = await ipcManager.invoke('plugin:get-all-plugins')
      set({ plugins: result || [] })
    } catch (error) {
      console.error('Failed to load plugins:', error)
      toast.error(i18next.t('plugin:messages.loadPluginsFailed'))
    } finally {
      set({ loading: false })
    }
  },

  loadStats: async () => {
    try {
      const result = await ipcManager.invoke('plugin:get-stats')
      set({ stats: result })
    } catch (error) {
      console.error('Failed to load plugin stats:', error)
    }
  },

  installPlugin: async (source, options) => {
    const result = await ipcManager.invoke('plugin:install-plugin', source, options)
    if (result.success) {
      toast.success(i18next.t('plugin:messages.installSuccess'))
    } else {
      toast.error(i18next.t('plugin:messages.installFailed', { error: result.error }))
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
        toast.success(i18next.t('plugin:messages.installSuccess'))
      } else {
        toast.error(i18next.t('plugin:messages.installFromFileFailed'))
      }
    } catch (error) {
      console.error('Failed to install plugin from file:', error)
      toast.error(i18next.t('plugin:messages.installFromFileFailed'))
    }
  },

  uninstallPlugin: async (pluginId) => {
    const result = await ipcManager.invoke('plugin:uninstall-plugin', pluginId)
    if (result.success) {
      toast.success(i18next.t('plugin:messages.uninstallSuccess'))
    } else {
      toast.error(i18next.t('plugin:messages.uninstallFailed'))
    }
  },

  togglePlugin: async (pluginId, activate) => {
    const action = activate ? 'plugin:activate-plugin' : 'plugin:deactivate-plugin'
    const result = await ipcManager.invoke(action, pluginId)

    if (result.success) {
      if (activate) {
        toast.success(i18next.t('plugin:messages.pluginActivated'))
      } else {
        toast.success(i18next.t('plugin:messages.pluginDeactivated'))
      }
    } else {
      if (activate) {
        toast.error(i18next.t('plugin:messages.pluginActivateFailed', { error: result.error }))
      } else {
        toast.error(i18next.t('plugin:messages.pluginDeactivateFailed', { error: result.error }))
      }
    }
  },

  checkUpdates: async (noToast?: boolean) => {
    set({ loading: true })
    let updates: PluginUpdateInfo[] | null = null
    try {
      updates = await ipcManager.invoke('plugin:check-updates')
      if (updates.length > 0) {
        !noToast &&
          toast.success(i18next.t('plugin:messages.updatesAvailable', { count: updates.length }))
      } else {
        !noToast && toast.info(i18next.t('plugin:messages.noUpdatesAvailable'))
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
      !noToast && toast.error(i18next.t('plugin:messages.checkUpdatesFailed'))
    } finally {
      set({ loading: false })
      set({ updates: updates || null })
    }
  }
}))

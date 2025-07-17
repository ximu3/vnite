import { create } from 'zustand'
import { syncTo } from '../utils'

/**
 * Plugin Store - 简单的插件数据存储
 * 参照PluginDBManager的设计，使用pluginId和key来存储数据
 */
export interface PluginState {
  initialized: boolean

  initializeStore: (data: any) => void

  // 缓存的插件数据，结构为: { pluginId: { key: value } }
  pluginData: Record<string, Record<string, any>>

  // 获取插件值
  getPluginValue: (pluginId: string, key: string, defaultValue?: any) => any

  // 设置插件值
  setPluginValue: (pluginId: string, key: string, value: any) => Promise<void>

  // 设置插件的所有数据（用于初始化）
  setPluginData: (pluginId: string, data: Record<string, any>) => void

  // 删除插件数据
  deletePluginData: (pluginId: string) => void

  // 获取所有插件ID
  getAllPluginIds: () => string[]
}

export const usePluginStore = create<PluginState>((set, get) => ({
  initialized: false,
  initializeStore: (data: any) => {
    set({ pluginData: data })
    set({ initialized: true })
  },
  pluginData: {},

  getPluginValue: (pluginId: string, key: string, defaultValue: any = null): any => {
    if (!get().initialized) {
      console.warn(`[PluginStore] ${pluginId} is not initialized`)
      return defaultValue
    }
    const state = get()
    const pluginValues = state.pluginData[pluginId] || {}
    return pluginValues[key] !== undefined ? pluginValues[key] : defaultValue
  },

  setPluginValue: async (pluginId: string, key: string, value: any): Promise<void> => {
    // 先更新本地状态
    set((state) => ({
      pluginData: {
        ...state.pluginData,
        [pluginId]: {
          ...(state.pluginData[pluginId] || {}),
          [key]: value
        }
      }
    }))

    // 同步到主进程
    try {
      await syncTo('plugin', pluginId, get().pluginData[pluginId])
    } catch (error) {
      console.error(`Failed to sync plugin value ${pluginId}.${key}:`, error)
      // 可以考虑回滚本地状态或显示错误提示
    }
  },

  setPluginData: (pluginId: string, data: Record<string, any>): void => {
    set((state) => ({
      pluginData: {
        ...state.pluginData,
        [pluginId]: data
      }
    }))
  },

  deletePluginData: (pluginId: string): void => {
    set((state) => {
      const newPluginData = { ...state.pluginData }
      delete newPluginData[pluginId]
      return { pluginData: newPluginData }
    })
  },

  getAllPluginIds: (): string[] => {
    return Object.keys(get().pluginData)
  }
}))

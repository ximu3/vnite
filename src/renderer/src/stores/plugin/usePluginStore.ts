import { create } from 'zustand'
import { syncTo } from '../utils'

export interface PluginState {
  initialized: boolean
  initializeStore: (data: any) => void
  pluginData: Record<string, Record<string, any>>

  getPluginValue: (pluginId: string, key: string, defaultValue?: any) => any
  setPluginValue: (pluginId: string, key: string, value: any) => Promise<void>
  setPluginData: (pluginId: string, data: Record<string, any>) => void
  deletePluginData: (pluginId: string) => void

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
    set((state) => ({
      pluginData: {
        ...state.pluginData,
        [pluginId]: {
          ...(state.pluginData[pluginId] || {}),
          [key]: value
        }
      }
    }))

    // Sync to main process
    try {
      await syncTo('plugin', pluginId, get().pluginData[pluginId])
    } catch (error) {
      console.error(`Failed to sync plugin value ${pluginId}.${key}:`, error)
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

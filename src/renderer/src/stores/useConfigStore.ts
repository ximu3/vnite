import { create } from 'zustand'
import { ipcInvoke, getNestedValue } from '~/utils'
import { DocChange, configDocs, PathsOf, DEFAULT_CONFIG_VALUES } from '@appTypes/database'
import type { Get } from 'type-fest'

export interface ConfigState {
  document: configDocs
  initialized: boolean
  getConfigValue: <Path extends string[]>(path: Path & PathsOf<configDocs>) => Get<configDocs, Path>
  setConfigValue: <Path extends string[]>(
    path: Path & PathsOf<configDocs>,
    value: Get<configDocs, Path>
  ) => Promise<void>
  initializeStore: (data: ConfigState['document']) => void
  setDocument: (data: configDocs) => void
}

const updateDocument = async (data: configDocs): Promise<void> => {
  const change: DocChange = {
    dbName: 'config',
    docId: 'config',
    data,
    timestamp: Date.now()
  }

  try {
    await ipcInvoke('db-changed', change)
  } catch (error) {
    console.error('Failed to sync with database:', error)
  }
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  document: {} as configDocs,
  initialized: false,

  setDocument: (data: configDocs): void => {
    set({
      document: data
    })
  },

  getConfigValue: <Path extends string[]>(
    path: Path & PathsOf<configDocs>
  ): Get<configDocs, Path> => {
    const state = get()
    if (!state.initialized) {
      return getNestedValue(DEFAULT_CONFIG_VALUES, path)
    }

    const value = getNestedValue(state.document, path)
    return value !== undefined ? value : getNestedValue(DEFAULT_CONFIG_VALUES, path)
  },

  setConfigValue: async <Path extends string[]>(
    path: Path & PathsOf<configDocs>,
    value: Get<configDocs, Path>
  ): Promise<void> => {
    // 先更新 store
    set((state) => {
      const newDocument = { ...state.document }
      let current = newDocument
      const lastIndex = path.length - 1

      // 构建嵌套路径
      for (let i = 0; i < lastIndex; i++) {
        const key = path[i]
        if (!(key in current)) {
          current[key] = {}
        }
        current = current[key]
      }

      // 设置最终值
      current[path[lastIndex]] = value

      return { document: newDocument }
    })

    // 然后异步更新文档
    await updateDocument(get().document)
  },

  initializeStore: (data): void =>
    set({
      document: data,
      initialized: true
    })
}))

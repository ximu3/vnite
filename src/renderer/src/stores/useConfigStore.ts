import { create } from 'zustand'
import { ipcInvoke, getValueByPath } from '~/utils'
import { DocChange, configDocs, DEFAULT_CONFIG_VALUES } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export interface ConfigState {
  document: configDocs
  initialized: boolean
  getConfigValue: <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path
  ) => Get<configDocs, Path>
  setConfigValue: <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path,
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

  getConfigValue: <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path
  ): Get<configDocs, Path> => {
    const state = get()
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    if (!state.initialized) {
      return getValueByPath(DEFAULT_CONFIG_VALUES, pathArray)
    }

    const value = getValueByPath(state.document, pathArray)
    return value !== undefined ? value : getValueByPath(DEFAULT_CONFIG_VALUES, pathArray)
  },

  setConfigValue: async <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configDocs, Path>
  ): Promise<void> => {
    // 先更新 store
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    set((state) => {
      const newDocument = { ...state.document }
      let current = newDocument
      const lastIndex = pathArray.length - 1

      // 构建嵌套路径
      for (let i = 0; i < lastIndex; i++) {
        const key = pathArray[i]
        if (!(key in current)) {
          current[key] = {}
        }
        current = current[key]
      }

      // 设置最终值
      current[pathArray[lastIndex]] = value

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

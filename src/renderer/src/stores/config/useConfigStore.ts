import { create } from 'zustand'
import { getValueByPath, setValueByPath } from '@appUtils'
import { configDocs, DEFAULT_CONFIG_VALUES } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'
import { syncTo } from '../utils'

export interface ConfigState {
  documents: configDocs
  initialized: boolean
  setDocuments: (data: configDocs) => void
  getConfigValue: <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path
  ) => Get<configDocs, Path>
  setConfigValue: <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configDocs, Path>
  ) => Promise<void>
  initializeStore: (data: ConfigState['documents']) => void
  setDocument: (docId: string, data: any) => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  documents: {} as configDocs,
  initialized: false,

  setDocuments: (data: configDocs): void => {
    set({ documents: data })
  },

  setDocument: (docId: string, data: any): void => {
    set((state) => ({
      documents: {
        ...state.documents,
        [docId]: data
      }
    }))
  },

  getConfigValue: <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path
  ): Get<configDocs, Path> => {
    const state = get()
    if (!state.initialized) {
      return getValueByPath(DEFAULT_CONFIG_VALUES, path)
    }
    const value = getValueByPath(state.documents, path)
    if (value === undefined) {
      get().setConfigValue(path, getValueByPath(DEFAULT_CONFIG_VALUES, path))
      return getValueByPath(DEFAULT_CONFIG_VALUES, path)
    }
    console.log('getConfigValue', path, value)
    return value
  },

  setConfigValue: async <Path extends Paths<configDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configDocs, Path>
  ): Promise<void> => {
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    const data = { ...get().documents }
    setValueByPath(data, path, value)
    set({ documents: data })

    await syncTo('config', pathArray[0], get().documents[pathArray[0]])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

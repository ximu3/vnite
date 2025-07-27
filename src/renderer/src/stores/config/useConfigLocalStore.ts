import { create } from 'zustand'
import { getValueByPath, setValueByPath } from '@appUtils'
import { configLocalDocs, DEFAULT_CONFIG_LOCAL_VALUES } from '@appTypes/models'
import type { Get, Paths } from 'type-fest'
import { syncTo } from '../utils'

export interface ConfigLocalState {
  documents: configLocalDocs
  initialized: boolean
  setDocuments: (data: configLocalDocs) => void
  getConfigLocalValue: <Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path
  ) => Get<configLocalDocs, Path>
  setConfigLocalValue: <Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configLocalDocs, Path>
  ) => Promise<void>
  initializeStore: (data: ConfigLocalState['documents']) => void
  setDocument: (docId: string, data: any) => void
}

export const useConfigLocalStore = create<ConfigLocalState>((set, get) => ({
  documents: {} as configLocalDocs,
  initialized: false,

  setDocuments: (data: configLocalDocs): void => {
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

  getConfigLocalValue: <Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path
  ): Get<configLocalDocs, Path> => {
    const state = get()
    if (!state.initialized) {
      return getValueByPath(DEFAULT_CONFIG_LOCAL_VALUES, path)
    }
    const value = getValueByPath(state.documents, path)
    return value !== undefined ? value : getValueByPath(DEFAULT_CONFIG_LOCAL_VALUES, path)
  },

  setConfigLocalValue: async <Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configLocalDocs, Path>
  ): Promise<void> => {
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    const data = { ...get().documents }
    setValueByPath(data, path, value)
    set({ documents: data })

    await syncTo('config-local', pathArray[0], get().documents[pathArray[0]])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

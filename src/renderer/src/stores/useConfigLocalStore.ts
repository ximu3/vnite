import { create } from 'zustand'
import { ipcInvoke } from '~/utils'
import { getValueByPath, setValueByPath } from '@appUtils'
import { DocChange, configLocalDocs, DEFAULT_CONFIG_LOCAL_VALUES } from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export interface ConfigLocalState {
  documents: configLocalDocs
  initialized: boolean
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

const updateDocument = async (docId: string, data: configLocalDocs): Promise<void> => {
  const change: DocChange = {
    dbName: 'config-local',
    docId: docId,
    data,
    timestamp: Date.now()
  }

  try {
    await ipcInvoke('db-changed', change)
  } catch (error) {
    console.error('Failed to sync with database:', error)
  }
}

export const useConfigLocalStore = create<ConfigLocalState>((set, get) => ({
  documents: {} as configLocalDocs,
  initialized: false,

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
    console.log('getConfigValue', path, value)
    return value !== undefined ? value : getValueByPath(DEFAULT_CONFIG_LOCAL_VALUES, path)
  },

  setConfigLocalValue: async <Path extends Paths<configLocalDocs, { bracketNotation: true }>>(
    path: Path,
    value: Get<configLocalDocs, Path>
  ): Promise<void> => {
    // 先更新 store
    const pathArray = path.replace(/$$(\d+)$$/g, '.$1').split('.')
    const data = { ...get().documents }
    setValueByPath(data, path, value)
    set({ documents: data })

    // 然后异步更新文档
    await updateDocument(pathArray[0], get().documents[pathArray[0]])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    })
}))

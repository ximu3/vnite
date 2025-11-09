import { create } from 'zustand'
import { ipcManager } from '~/app/ipc'

export interface GamePathInfo {
  valid: boolean | null // null for uncheck
  lastChecked?: number
}

export interface GamePathStore {
  paths: Record<string, GamePathInfo> // key = path
  addPaths: (paths: string[]) => void
  setValidity: (path: string, valid: boolean) => void
  verifyAll: () => Promise<void>
  requestValidity: (path: string) => Promise<void>
  clear: () => void
}

export const useGamePathStore = create<GamePathStore>((set, get) => ({
  paths: {},

  addPaths: (paths) => {
    const newPaths: Record<string, GamePathInfo> = {}
    paths.forEach((p) => {
      if (!p) return
      newPaths[p] = { valid: null }
    })
    set((state) => ({
      paths: { ...newPaths, ...state.paths }
    }))
  },

  setValidity: (path, valid) =>
    set((state) => ({
      paths: {
        ...state.paths,
        [path]: { valid, lastChecked: Date.now() }
      }
    })),

  verifyAll: async () => {
    const allPaths = Object.entries(get().paths)
      .filter(([, info]) => info.valid === null)
      .map(([path]) => path)

    if (allPaths.length === 0) return

    const results: boolean[] =
      (await ipcManager.invoke('system:check-if-path-exist', allPaths)) ?? []

    allPaths.forEach((path, idx) => {
      get().setValidity(path, results[idx])
    })
  },

  requestValidity: async (path: string) => {
    const info = get().paths[path]

    if (!info || info.valid === null) {
      get().addPaths([path])
      await get().verifyAll()
    }
  },

  clear: () => set({ paths: {} })
}))

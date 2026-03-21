import { create } from 'zustand'

export type ConfigTab =
  | 'general'
  | 'appearances'
  | 'advanced'
  | 'metadata'
  | 'theme'
  | 'hotkeys'
  | 'cloudSync'
  | 'scraper'
  | 'database'
  | 'network'
  | 'about'

interface ConfigTabStore {
  lastConfigTab: ConfigTab
  setLastConfigTab: (tab: ConfigTab) => void
}

export const useConfigTabStore = create<ConfigTabStore>((set) => ({
  lastConfigTab: 'general',
  setLastConfigTab: (tab) => set({ lastConfigTab: tab })
}))

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

export type ConfigSection = 'toolbox' | 'launcher-presets'

interface ConfigTabStore {
  lastConfigTab: ConfigTab
  pendingSection: ConfigSection | null
  setLastConfigTab: (tab: ConfigTab) => void
  setPendingSection: (section: ConfigSection | null) => void
}

export const useConfigTabStore = create<ConfigTabStore>((set) => ({
  lastConfigTab: 'general',
  pendingSection: null,
  setLastConfigTab: (tab) => set({ lastConfigTab: tab }),
  setPendingSection: (section) => set({ pendingSection: section })
}))

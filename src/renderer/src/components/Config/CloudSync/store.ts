import { create } from 'zustand'

export interface SyncStatus {
  status: 'syncing' | 'success' | 'error'
  message: string
  timestamp: string
}

interface CloudSyncState {
  status: SyncStatus | null
  setStatus: (status: SyncStatus | null) => void
}

export const useCloudSyncStore = create<CloudSyncState>((set) => ({
  status: null,
  setStatus: (status): void => set({ status })
}))

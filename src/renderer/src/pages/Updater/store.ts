import { create } from 'zustand'

export interface UpdateInfo {
  version: string
  releaseNotes: string
}

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  total: number
  transferred: number
}

interface UpdaterState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  updateInfo: UpdateInfo | null
  setUpdateInfo: (updateInfo: UpdateInfo | null) => void
  downloading: boolean
  setDownloading: (downloading: boolean) => void
  progress: UpdateProgress | null
  setProgress: (progress: UpdateProgress | null) => void
  downloadComplete: boolean
  setDownloadComplete: (downloadComplete: boolean) => void
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen): void => set({ isOpen }),
  updateInfo: null,
  setUpdateInfo: (updateInfo): void => set({ updateInfo }),
  downloading: false,
  setDownloading: (downloading): void => set({ downloading }),
  progress: null,
  setProgress: (progress): void => set({ progress }),
  downloadComplete: false,
  setDownloadComplete: (downloadComplete): void => set({ downloadComplete })
}))

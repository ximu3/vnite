import { create } from 'zustand'

interface ImageTimestamp {
  [key: string]: number // key format: `${gameId}/${type}`
}

interface ImageStore {
  timestamps: ImageTimestamp
  updateTimestamp: (gameId: string, type: string) => void
  getTimestamp: (gameId: string, type: string) => number
}

export const useImageStore = create<ImageStore>((set, get) => ({
  timestamps: {},
  updateTimestamp: (gameId: string, type: string): void => {
    set((state) => ({
      timestamps: {
        ...state.timestamps,
        [`${gameId}/${type}`]: Date.now()
      }
    }))
  },
  getTimestamp: (gameId: string, type: string): number => {
    const key = `${gameId}/${type}`
    const { timestamps } = get()
    if (!timestamps[key]) {
      // Initialize a timestamp if it doesn't exist
      set((state) => ({
        timestamps: {
          ...state.timestamps,
          [key]: Date.now()
        }
      }))
    }
    return timestamps[key]
  }
}))

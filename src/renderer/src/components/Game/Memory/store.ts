import { create } from 'zustand'

export type MemoryCropDialogState =
  | {
      open: false
      gameId: null
      memoryId: null
      imagePath: null
      isResizing: false
    }
  | {
      open: true
      gameId: string
      memoryId: string
      imagePath: string
      isResizing: boolean
    }

interface MemoryStore {
  cropDialog: MemoryCropDialogState
  openCropDialog: (params: {
    gameId: string
    memoryId: string
    imagePath: string
    isResizing: boolean
  }) => void
  closeCropDialog: () => void
}

const closedCropDialogState: MemoryCropDialogState = {
  open: false,
  gameId: null,
  memoryId: null,
  imagePath: null,
  isResizing: false
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  cropDialog: closedCropDialogState,
  openCropDialog: ({ gameId, memoryId, imagePath, isResizing }): void =>
    set({
      cropDialog: {
        open: true,
        gameId,
        memoryId,
        imagePath,
        isResizing
      }
    }),
  closeCropDialog: (): void => set({ cropDialog: closedCropDialogState })
}))

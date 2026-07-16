import { create } from 'zustand'
import type { NoteDialogMode } from './NoteDialog'

export type MemoryCropImageSource = 'selected-file' | 'existing-cover'

export type MemoryCropDialogState =
  | {
      open: false
      gameId: null
      memoryId: null
      imagePath: null
      imageSource: null
    }
  | {
      open: true
      gameId: string
      memoryId: string
      imagePath: string
      imageSource: MemoryCropImageSource
    }

export type MemoryNoteDialogState =
  | {
      open: false
      memoryId: null
      initialMode: NoteDialogMode
    }
  | {
      open: true
      memoryId: string
      initialMode: NoteDialogMode
    }

interface MemoryStore {
  cropDialog: MemoryCropDialogState
  openCropDialog: (params: {
    gameId: string
    memoryId: string
    imagePath: string
    imageSource: MemoryCropImageSource
  }) => void
  closeCropDialog: () => void
  noteDialog: MemoryNoteDialogState
  openNoteDialog: (params: { memoryId: string; initialMode?: NoteDialogMode }) => void
  closeNoteDialog: () => void
}

const closedCropDialogState: MemoryCropDialogState = {
  open: false,
  gameId: null,
  memoryId: null,
  imagePath: null,
  imageSource: null
}

const closedNoteDialogState: MemoryNoteDialogState = {
  open: false,
  memoryId: null,
  initialMode: 'edit'
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  cropDialog: closedCropDialogState,
  openCropDialog: ({ gameId, memoryId, imagePath, imageSource }): void =>
    set({
      cropDialog: {
        open: true,
        gameId,
        memoryId,
        imagePath,
        imageSource
      }
    }),
  closeCropDialog: (): void => set({ cropDialog: closedCropDialogState }),
  noteDialog: closedNoteDialogState,
  openNoteDialog: ({ memoryId, initialMode = 'edit' }): void =>
    set({
      noteDialog: {
        open: true,
        memoryId,
        initialMode
      }
    }),
  closeNoteDialog: (): void => set({ noteDialog: closedNoteDialogState })
}))

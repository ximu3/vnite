import { create } from 'zustand'
import type { NoteDialogMode } from './NoteDialog'

export type MemoryCropDialogState =
  | {
      open: false
      gameId: null
      memoryId: null
      imagePath: null
    }
  | {
      open: true
      gameId: string
      memoryId: string
      imagePath: string
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
  openCropDialog: (params: { gameId: string; memoryId: string; imagePath: string }) => void
  closeCropDialog: () => void
  noteDialog: MemoryNoteDialogState
  openNoteDialog: (params: { memoryId: string; initialMode?: NoteDialogMode }) => void
  closeNoteDialog: () => void
}

const closedCropDialogState: MemoryCropDialogState = {
  open: false,
  gameId: null,
  memoryId: null,
  imagePath: null
}

const closedNoteDialogState: MemoryNoteDialogState = {
  open: false,
  memoryId: null,
  initialMode: 'edit'
}

export const useMemoryStore = create<MemoryStore>((set) => ({
  cropDialog: closedCropDialogState,
  openCropDialog: ({ gameId, memoryId, imagePath }): void =>
    set({
      cropDialog: {
        open: true,
        gameId,
        memoryId,
        imagePath
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

import { create } from 'zustand'

export interface GameDetailStore {
  isEditingLogo: boolean
  setIsEditingLogo: (isEditing: boolean) => void

  isPlayTimeEditorDialogOpen: boolean
  setIsPlayTimeEditorDialogOpen: (open: boolean) => void

  isScoreEditorDialogOpen: boolean
  setIsScoreEditorDialogOpen: (open: boolean) => void
}

export const useGameDetailStore = create<GameDetailStore>((set) => ({
  isEditingLogo: false,
  setIsEditingLogo: (isEditing): void => set({ isEditingLogo: isEditing }),

  isPlayTimeEditorDialogOpen: false,
  setIsPlayTimeEditorDialogOpen: (open): void => set({ isPlayTimeEditorDialogOpen: open }),

  isScoreEditorDialogOpen: false,
  setIsScoreEditorDialogOpen: (open) => set({ isScoreEditorDialogOpen: open })
}))

import { create } from 'zustand'

export interface GameDetailStore {
  isEditingLogo: boolean
  setIsEditingLogo: (isEditing: boolean) => void

  isPlayTimeEditorDialogOpen: boolean
  setIsPlayTimeEditorDialogOpen: (open: boolean) => void

  isRatingEditorDialogOpen: boolean
  setIsRatingEditorDialogOpen: (open: boolean) => void
}

export const useGameDetailStore = create<GameDetailStore>((set) => ({
  isEditingLogo: false,
  setIsEditingLogo: (isEditing): void => set({ isEditingLogo: isEditing }),

  isPlayTimeEditorDialogOpen: false,
  setIsPlayTimeEditorDialogOpen: (open): void => set({ isPlayTimeEditorDialogOpen: open }),

  isRatingEditorDialogOpen: false,
  setIsRatingEditorDialogOpen: (open) => set({ isRatingEditorDialogOpen: open })
}))

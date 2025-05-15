import { create } from 'zustand'

export interface GameDetailStore {
  isEditingLogo: boolean
  setIsEditingLogo: (isEditing: boolean) => void
}

export const useGameDetailStore = create<GameDetailStore>((set) => ({
  isEditingLogo: false,
  setIsEditingLogo: (isEditing): void => set({ isEditingLogo: isEditing })
}))

import { create } from 'zustand'

export type PropertiesDialogTab = 'launcher' | 'path' | 'media'

export interface GameDetailStore {
  isEditingLogo: boolean
  setIsEditingLogo: (isEditing: boolean) => void

  isPlayTimeEditorDialogOpen: boolean
  setIsPlayTimeEditorDialogOpen: (open: boolean) => void

  isScoreEditorDialogOpen: boolean
  setIsScoreEditorDialogOpen: (open: boolean) => void

  isInformationDialogOpen: boolean
  setIsInformationDialogOpen: (open: boolean) => void

  propertiesDialog: { open: false } | { open: true; defaultTab: PropertiesDialogTab }
  openPropertiesDialog: (defaultTab?: PropertiesDialogTab) => void
  closePropertiesDialog: () => void
}

export const useGameDetailStore = create<GameDetailStore>((set) => ({
  isEditingLogo: false,
  setIsEditingLogo: (isEditing): void => set({ isEditingLogo: isEditing }),

  isPlayTimeEditorDialogOpen: false,
  setIsPlayTimeEditorDialogOpen: (open): void => set({ isPlayTimeEditorDialogOpen: open }),

  isScoreEditorDialogOpen: false,
  setIsScoreEditorDialogOpen: (open) => set({ isScoreEditorDialogOpen: open }),

  isInformationDialogOpen: false,
  setIsInformationDialogOpen: (open): void => set({ isInformationDialogOpen: open }),

  propertiesDialog: { open: false },
  openPropertiesDialog: (defaultTab = 'launcher') =>
    set({ propertiesDialog: { open: true, defaultTab } }),
  closePropertiesDialog: () => set({ propertiesDialog: { open: false } })
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PropertiesDialogTab = 'launcher' | 'path' | 'media'
type MemoryPageView = 'grid' | 'masonry' | 'list'
type MemoryPageByView = Record<MemoryPageView, number>

type ImageViewerDialogState = { open: false; imagePath: null } | { open: true; imagePath: string }

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

  imageViewerDialog: ImageViewerDialogState
  openImageViewerDialog: (imagePath: string) => void
  closeImageViewerDialog: () => void

  memoryPageByGameId: Record<string, MemoryPageByView>
  setMemoryPageByView: (gameId: string, view: MemoryPageView, page: number) => void
}

export const DEFAULT_MEMORY_PAGE_BY_VIEW: MemoryPageByView = {
  grid: 1,
  masonry: 1,
  list: 1
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
  closePropertiesDialog: () => set({ propertiesDialog: { open: false } }),

  imageViewerDialog: { open: false, imagePath: null },
  openImageViewerDialog: (imagePath) => set({ imageViewerDialog: { open: true, imagePath } }),
  closeImageViewerDialog: () => set({ imageViewerDialog: { open: false, imagePath: null } }),

  memoryPageByGameId: {},
  setMemoryPageByView: (gameId, view, page) =>
    set((state) => ({
      memoryPageByGameId: {
        ...state.memoryPageByGameId,
        [gameId]: {
          ...(state.memoryPageByGameId[gameId] ?? DEFAULT_MEMORY_PAGE_BY_VIEW),
          [view]: page
        }
      }
    }))
}))

interface GameDetailTabStore {
  lastDetailTab: 'overview' | 'record' | 'save' | 'memory'
  setLastDetailTab: (tab: 'overview' | 'record' | 'save' | 'memory') => void
  lastMemoryViewMode: MemoryPageView
  setLastMemoryViewMode: (mode: MemoryPageView) => void
}

export const useGameDetailTabStore = create<GameDetailTabStore>()(
  persist(
    (set) => ({
      lastDetailTab: 'overview',
      setLastDetailTab: (tab) => set({ lastDetailTab: tab }),
      lastMemoryViewMode: 'grid',
      setLastMemoryViewMode: (mode) => set({ lastMemoryViewMode: mode })
    }),
    {
      name: 'game-detail-last-tab',
      partialize: (state) => ({
        lastDetailTab: state.lastDetailTab,
        lastMemoryViewMode: state.lastMemoryViewMode
      })
    }
  )
)

import type { GameMemoryViewMode } from '@appTypes/models'

/** Render-ready memory data composed from the persisted entry and cover metadata. */
export interface MemoryViewItem {
  memoryId: string
  date: string
  note: string
  pinned: boolean
  coverHeightRatio?: number
}

/** Shared runtime operations available to every memory view. */
export interface MemoryViewRuntime {
  gameId: string
  openImage: (memoryId: string) => void
  togglePin: (memoryId: string) => Promise<void>
  deleteMemory: (memoryId: string) => Promise<void>
  selectCover: (memoryId: string) => Promise<void>
  resizeCover: (memoryId: string) => Promise<void>
  setCoverAsGameMedia: (memoryId: string, type: 'cover' | 'background') => Promise<void>
  markCoverMissing: (memoryId: string) => void
}

/** Base contract implemented by all four memory views. */
export interface MemoryViewProps {
  items: readonly MemoryViewItem[]
  runtime: MemoryViewRuntime
}

export type MemoryNoteDisplay = {
  title: string
  summary: string
}

export type NoteDialogMode = 'edit' | 'preview'

export const MEMORY_ITEMS_PER_PAGE_UNPAGINATED = 0

export const MEMORY_ITEMS_PER_PAGE_OPTIONS: Record<GameMemoryViewMode, number[]> = {
  grid: [6, 9, 12, 15, 18, 24, 30],
  masonry: [10, 15, 20, 30, 40, 60],
  list: [10, 20, 30, 40, 50],
  full: [6, 9, 12, 15, 18, 24, 30]
}

export type MemoryViewMode = 'grid' | 'masonry' | 'list'

export const MEMORY_ITEMS_PER_PAGE_OPTIONS: Record<MemoryViewMode, number[]> = {
  grid: [6, 9, 12, 15, 18, 24, 30],
  masonry: [10, 15, 20, 30, 40, 60],
  list: [10, 20, 30, 40, 50]
}

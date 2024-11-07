import { create } from 'zustand'

interface FilterStore {
  filter: Record<string, string[]>
  setFilter: (filter: Record<string, string[]>) => void
  clearFilter: () => void
  addFilter: (field: string, value: string) => void
  deleteFilter: (field: string, value: string) => void
  updateFilter: (field: string, value: string[]) => void
  isFilterMenuOpen: boolean
  setIsFilterMenuOpen: (isOpen: boolean) => void
  toggleFilterMenu: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  filter: {},
  setFilter: (filter): void => set({ filter }),
  clearFilter: (): void => set({ filter: {} }),
  addFilter: (field, value): void =>
    set((state) => {
      const values = state.filter[field] || []
      return {
        filter: {
          ...state.filter,
          [field]: [...values, value]
        }
      }
    }),
  deleteFilter: (field, value): void =>
    set((state) => {
      const values = state.filter[field] || []
      if (value === '#all') {
        const { [field]: _, ...rest } = state.filter
        return { filter: rest }
      }

      const newValues = values.filter((v) => v !== value)

      if (newValues.length === 0) {
        const { [field]: _, ...rest } = state.filter
        return { filter: rest }
      } else {
        return {
          filter: {
            ...state.filter,
            [field]: newValues
          }
        }
      }
    }),
  updateFilter: (field, value): void =>
    set((state) => ({
      filter: {
        ...state.filter,
        [field]: value
      }
    })),
  isFilterMenuOpen: false,
  setIsFilterMenuOpen: (isOpen): void => set({ isFilterMenuOpen: isOpen }),
  toggleFilterMenu: (): void => set((state) => ({ isFilterMenuOpen: !state.isFilterMenuOpen }))
}))

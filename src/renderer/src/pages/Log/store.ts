import { create } from 'zustand'

interface LogState {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useLogStore = create<LogState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen })
}))

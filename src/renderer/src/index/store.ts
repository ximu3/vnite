import { create } from 'zustand'
import { GameIndexdata } from './types'

interface GameIndexStore {
  index: Map<string, Partial<GameIndexdata>>
  setIndex: (newIndex: Map<string, Partial<GameIndexdata>>) => void
}

export const useGameIndexStore = create<GameIndexStore>((set) => ({
  index: new Map(),
  setIndex: (newIndex): void => set({ index: newIndex })
}))

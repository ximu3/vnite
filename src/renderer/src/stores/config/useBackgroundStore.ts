import { create } from 'zustand'

interface BackgroundRefreshState {
  refreshToken: number
  triggerRefresh: () => void
}

export const useBackgroundRefreshStore = create<BackgroundRefreshState>((set) => ({
  refreshToken: 0,
  triggerRefresh: () => set(state => ({ refreshToken: state.refreshToken + 1 })),
}))

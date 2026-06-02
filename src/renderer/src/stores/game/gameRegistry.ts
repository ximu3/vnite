import { create } from 'zustand'

export interface GameMetaInfo {
  name: string
  originalName?: string
  sortName?: string
  genres?: string[]
  addDate?: string
  lastRunDate?: string
  hideFromRecentGames?: boolean
  score?: number
  nsfw?: boolean
  gamePath?: string
}

interface GameRegistry {
  // Stores only the game ID and minimal metadata, not the full data
  gameIds: string[]
  gameMetaIndex: Record<string, GameMetaInfo>
  // game-local may report gamePath before the main game document is registered.
  pendingGameMetaIndex: Record<string, Partial<GameMetaInfo>>

  // Registry Management Methods
  registerGame: (gameId: string, metaInfo: GameMetaInfo) => void
  unregisterGame: (gameId: string) => void
  setGameIds: (ids: string[]) => void
  updateGameMeta: (gameId: string, metaInfo: Partial<GameMetaInfo>) => void

  // initialization state
  initialized: boolean
  setInitialized: (value: boolean) => void

  // games loaded state (phase 2 loading complete)
  gamesLoaded: boolean
  setGamesLoaded: (value: boolean) => void
}

export const useGameRegistry = create<GameRegistry>((set) => ({
  gameIds: [],
  gameMetaIndex: {},
  pendingGameMetaIndex: {},
  initialized: false,
  gamesLoaded: false,

  registerGame: (gameId, metaInfo): void =>
    set((state) => {
      // Merge any earlier game-local metadata into the formal registry entry on first game registration.
      const pendingMeta = state.pendingGameMetaIndex[gameId]
      const nextPendingGameMetaIndex = { ...state.pendingGameMetaIndex }
      delete nextPendingGameMetaIndex[gameId]

      return {
        gameIds: state.gameIds.includes(gameId) ? state.gameIds : [...state.gameIds, gameId],
        gameMetaIndex: {
          ...state.gameMetaIndex,
          [gameId]: {
            ...state.gameMetaIndex[gameId],
            ...pendingMeta,
            ...metaInfo
          }
        },
        pendingGameMetaIndex: nextPendingGameMetaIndex
      }
    }),

  unregisterGame: (gameId): void =>
    set((state) => ({
      gameIds: state.gameIds.filter((id) => id !== gameId),
      gameMetaIndex: Object.fromEntries(
        Object.entries(state.gameMetaIndex).filter(([id]) => id !== gameId)
      ),
      pendingGameMetaIndex: Object.fromEntries(
        Object.entries(state.pendingGameMetaIndex).filter(([id]) => id !== gameId)
      )
    })),

  setGameIds: (ids): void => set({ gameIds: ids }),

  updateGameMeta: (gameId, metaInfo): void =>
    set((state) => {
      if (!(gameId in state.gameMetaIndex)) {
        // Store partial metadata in pending when game-local arrives before the main game document.
        return {
          pendingGameMetaIndex: {
            ...state.pendingGameMetaIndex,
            [gameId]: {
              ...state.pendingGameMetaIndex[gameId],
              ...metaInfo
            }
          }
        }
      }

      return {
        gameMetaIndex: {
          ...state.gameMetaIndex,
          [gameId]: {
            ...state.gameMetaIndex[gameId],
            ...metaInfo
          }
        }
      }
    }),

  setInitialized: (value): void => set({ initialized: value }),
  setGamesLoaded: (value): void => set({ gamesLoaded: value })
}))

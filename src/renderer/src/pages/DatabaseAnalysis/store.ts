import type { GameDatabaseStorageDetail, LocalDatabaseStorageReport } from '@appTypes/models'
import { create } from 'zustand'
import { ipcManager } from '~/app/ipc'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

export interface Loadable<T> {
  status: LoadStatus
  data: T | null
  error: string | null
  requestId: number | null
  isRefreshing: boolean
}

interface DatabaseAnalysisState {
  overview: Loadable<LocalDatabaseStorageReport>
  detailsByGameId: Record<string, Loadable<GameDatabaseStorageDetail>>
  ensureOverview: () => Promise<void>
  refreshOverview: () => Promise<void>
  ensureGameDetail: (gameId: string) => Promise<void>
  refreshGameDetail: (gameId: string) => Promise<void>
  clearAllDetails: () => void
  invalidateOverview: () => void
}

let overviewPromise: Promise<void> | null = null
const detailPromises = new Map<string, Promise<void>>()
let nextRequestId = 0

function createRequestId(): number {
  nextRequestId += 1
  return nextRequestId
}

function createEmptyLoadable<T>(): Loadable<T> {
  return {
    status: 'idle',
    data: null,
    error: null,
    requestId: null,
    isRefreshing: false
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export const useDatabaseAnalysisStore = create<DatabaseAnalysisState>((set, get) => ({
  overview: createEmptyLoadable<LocalDatabaseStorageReport>(),
  detailsByGameId: {},

  ensureOverview: async (): Promise<void> => {
    const { overview, refreshOverview } = get()
    if (overview.status === 'success' && overview.data) return
    if (overview.status === 'loading' && overviewPromise) return await overviewPromise
    await refreshOverview()
  },

  refreshOverview: async (): Promise<void> => {
    if (overviewPromise) return await overviewPromise

    const requestId = createRequestId()
    set((state) => ({
      overview: {
        ...state.overview,
        status: state.overview.data ? 'success' : 'loading',
        error: null,
        requestId,
        isRefreshing: Boolean(state.overview.data)
      }
    }))

    overviewPromise = (async () => {
      try {
        const data = await ipcManager.invoke('db:get-local-storage-report')
        set((state) => {
          if (state.overview.requestId !== requestId) return state
          return {
            overview: {
              status: 'success',
              data,
              error: null,
              requestId: null,
              isRefreshing: false
            },
            detailsByGameId: {}
          }
        })
      } catch (error) {
        const message = getErrorMessage(error)
        set((state) => {
          if (state.overview.requestId !== requestId) return state

          const hasStaleData = Boolean(state.overview.data)
          return {
            overview: {
              ...state.overview,
              status: hasStaleData ? 'success' : 'error',
              error: message,
              requestId: null,
              isRefreshing: false
            }
          }
        })
        throw error
      } finally {
        overviewPromise = null
      }
    })()

    return await overviewPromise
  },

  ensureGameDetail: async (gameId: string): Promise<void> => {
    const detail = get().detailsByGameId[gameId]
    if (detail?.status === 'success' && detail.data) return
    if (detail?.status === 'loading' && detailPromises.has(gameId)) {
      return await detailPromises.get(gameId)
    }
    await get().refreshGameDetail(gameId)
  },

  refreshGameDetail: async (gameId: string): Promise<void> => {
    const existingPromise = detailPromises.get(gameId)
    if (existingPromise) return await existingPromise

    const requestId = createRequestId()
    set((state) => {
      const current =
        state.detailsByGameId[gameId] ?? createEmptyLoadable<GameDatabaseStorageDetail>()
      return {
        detailsByGameId: {
          ...state.detailsByGameId,
          [gameId]: {
            ...current,
            status: current.data ? 'success' : 'loading',
            error: null,
            requestId,
            isRefreshing: Boolean(current.data)
          }
        }
      }
    })

    const promise = (async () => {
      try {
        const data = await ipcManager.invoke('db:get-game-storage-detail', gameId)
        set((state) => {
          const current = state.detailsByGameId[gameId]
          if (!current || current.requestId !== requestId) return state
          return {
            detailsByGameId: {
              ...state.detailsByGameId,
              [gameId]: {
                status: 'success',
                data,
                error: null,
                requestId: null,
                isRefreshing: false
              }
            }
          }
        })
      } catch (error) {
        const message = getErrorMessage(error)
        set((state) => {
          const current =
            state.detailsByGameId[gameId] ?? createEmptyLoadable<GameDatabaseStorageDetail>()
          if (current.requestId !== requestId) return state

          const hasStaleData = Boolean(current.data)
          return {
            detailsByGameId: {
              ...state.detailsByGameId,
              [gameId]: {
                ...current,
                status: hasStaleData ? 'success' : 'error',
                error: message,
                requestId: null,
                isRefreshing: false
              }
            }
          }
        })
        throw error
      } finally {
        detailPromises.delete(gameId)
      }
    })()

    detailPromises.set(gameId, promise)
    return await promise
  },

  clearAllDetails: (): void => {
    set({ detailsByGameId: {} })
  },

  invalidateOverview: (): void => {
    set({ overview: createEmptyLoadable<LocalDatabaseStorageReport>() })
  }
}))

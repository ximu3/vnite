import { create } from 'zustand'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { useMemo } from 'react'

interface MediaData {
  protocol: string
  path: string
  timestamp: number
}

type MediaKey = `game_${string}_${MediaType}`

export type MediaType = 'cover' | 'background' | 'icon'

interface MediaStore {
  media: Record<MediaKey, MediaData | undefined>
  ensureMediaSubscription: (gameId: string, type: MediaType, defaultProtocol: string) => void
  getMediaData: (gameId: string, type: MediaType) => MediaData | undefined
  refreshMedia: (gameId: string, type: MediaType, defaultProtocol: string) => Promise<void>
}

const useMediaStore = create<MediaStore>((set, get) => ({
  media: {},

  ensureMediaSubscription: (gameId, type, defaultProtocol): void => {
    const key = `game_${gameId}_${type}` as MediaKey
    if (get().media[key]) return // Already subscribed

    const fetchAndSetMedia = async (): Promise<void> => {
      try {
        const mediaPath = await ipcInvoke<string>('get-game-media-path', gameId, type)
        if (mediaPath) {
          set((state) => ({
            media: {
              ...state.media,
              [key]: {
                protocol: defaultProtocol,
                path: mediaPath,
                timestamp: Date.now()
              }
            }
          }))
        } else {
          throw new Error(`No media path found for game ${gameId} ${type}`)
        }
      } catch (error) {
        console.error('Failed to fetch media:', error)
      }
    }

    // Set up IPC listener
    const removeListener = ipcOnUnique('reload-db-values', async (_event, updatedMediaPath) => {
      const match = updatedMediaPath.match(/games\/([^/]+)\/([^.]+)/)
      if (!match) return

      const [, updatedGameId, mediaType] = match
      if (updatedGameId === gameId && mediaType === type) {
        await fetchAndSetMedia()
      }
    })

    // Initialize media data
    fetchAndSetMedia()

    // Store subscription details
    set((state) => ({
      media: {
        ...state.media,
        [key]: {
          ...state.media[key],
          removeListener
        }
      }
    }))
  },

  getMediaData: (gameId, type): MediaData | undefined => {
    const key = `game_${gameId}_${type}` as MediaKey
    return get().media[key]
  },

  refreshMedia: async (gameId, type, defaultProtocol): Promise<void> => {
    const key = `game_${gameId}_${type}` as MediaKey
    try {
      const mediaPath = await ipcInvoke<string>('get-game-media-path', gameId, type)
      if (mediaPath) {
        set((state) => ({
          media: {
            ...state.media,
            [key]: {
              protocol: defaultProtocol,
              path: mediaPath,
              timestamp: Date.now()
            }
          }
        }))
      } else {
        throw new Error(`No media path found for game ${gameId} ${type}`)
      }
    } catch (error) {
      console.error('Failed to refresh media:', error)
    }
  }
}))

interface UseGameMediaOptions {
  gameId: string
  type: MediaType
  defaultProtocol?: string
  noToastError?: boolean
}

interface UseGameMediaResult {
  mediaUrl: string | undefined
  isLoading: boolean
  error: Error | null
  refreshMedia: () => Promise<void>
}

export function useGameMedia({
  gameId,
  type,
  defaultProtocol = 'app'
}: UseGameMediaOptions): UseGameMediaResult {
  const { ensureMediaSubscription, getMediaData, refreshMedia } = useMediaStore()

  // Ensure subscription on first render
  ensureMediaSubscription(gameId, type, defaultProtocol)

  // Get current media data
  const currentMediaData = getMediaData(gameId, type)

  // Construct media URL
  const mediaUrl = useMemo(() => {
    if (!currentMediaData?.path) return undefined
    const normalizedPath = currentMediaData.path.replace(/\\/g, '/')
    return `${currentMediaData.protocol}:///${normalizedPath}?t=${currentMediaData.timestamp}`
  }, [currentMediaData])

  // Manual refresh function
  const refresh = async (): Promise<void> => {
    await refreshMedia(gameId, type, defaultProtocol)
  }

  return {
    mediaUrl,
    isLoading: !currentMediaData,
    error: null, // Error handling can be improved based on specific needs
    refreshMedia: refresh
  }
}

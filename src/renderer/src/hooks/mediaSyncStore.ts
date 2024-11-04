import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { create } from 'zustand'
import { ipcInvoke, ipcOnUnique } from '~/utils/ipc'

export type MediaType = 'icon' | 'cover' | 'background' | 'screenshot'

// 在 store 中重新定义需要的接口
interface MediaData {
  protocol: string
  path: string
  timestamp: number
}

type MediaKey = `game_${string}_${MediaType}`

interface MediaStore {
  [key: MediaKey]: MediaData | undefined
  setMediaData: (gameId: string, type: MediaType, data: Omit<MediaData, 'timestamp'>) => void
  updateTimestamp: (gameId: string, type: MediaType) => void
  getMediaData: (gameId: string, type: MediaType) => MediaData | undefined
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  setMediaData: (
    gameId: string,
    type: MediaType,
    mediaData: Omit<MediaData, 'timestamp'>
  ): void => {
    const key = `game_${gameId}_${type}` as MediaKey
    set({
      [key]: {
        ...mediaData,
        timestamp: Date.now()
      }
    })
  },

  updateTimestamp: (gameId: string, type: MediaType): void => {
    const key = `game_${gameId}_${type}` as MediaKey
    set((state) => {
      const currentData = state[key]
      if (!currentData) return state

      return {
        [key]: {
          ...currentData,
          timestamp: Date.now()
        }
      }
    })
  },

  getMediaData: (gameId: string, type: MediaType): MediaData | undefined => {
    const key = `game_${gameId}_${type}` as MediaKey
    return get()[key]
  }
}))

interface UseGameMediaOptions {
  gameId: string
  type: MediaType
  defaultProtocol?: string
}

interface UseGameMediaResult {
  mediaUrl: string | undefined // 改为 undefined 而不是 null
  isLoading: boolean
  error: Error | null
  refreshMedia: () => void
}

export function useGameMedia({
  gameId,
  type,
  defaultProtocol = 'app'
}: UseGameMediaOptions): UseGameMediaResult {
  const { setMediaData, getMediaData, updateTimestamp } = useMediaStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 获取当前多媒体数据
  const currentMediaData = getMediaData(gameId, type)

  // 从主进程获取多媒体路径并初始化
  useEffect(() => {
    const initializeMedia = async (): Promise<void> => {
      if (!currentMediaData) {
        try {
          setIsLoading(true)
          setError(null)

          // 从主进程获取多媒体路径
          const mediaPath = await ipcInvoke<string>('get-game-media-path', gameId, type)

          if (mediaPath) {
            setMediaData(gameId, type, {
              protocol: defaultProtocol,
              path: mediaPath
            })
          } else {
            throw new Error(`No media path found for game ${gameId} ${type}`)
          }
        } catch (error) {
          console.error('Failed to initialize media:', error)
          setError(error instanceof Error ? error : new Error('Unknown error'))
          if (error instanceof Error) {
            toast.error(`Failed to initialize media: ${error.message}`)
          }
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    initializeMedia()
  }, [gameId, type, defaultProtocol, currentMediaData])

  // 监听特定游戏和多媒体类型的 IPC 更新信号
  useEffect(() => {
    const updateListener = async (
      _event: Electron.IpcRendererEvent,
      updatedMediaPath: string
    ): Promise<void> => {
      // 解析路径中的 gameId
      const match = updatedMediaPath.match(/games\/([^/]+)\/([^.]+)/)
      if (!match) return

      const [, updatedGameId, mediaType] = match

      // 检查 gameId 和 mediaType 是否匹配
      if (updatedGameId === gameId && mediaType === type) {
        try {
          setIsLoading(true)
          setError(null)

          // 重新从主进程获取多媒体路径
          const mediaPath = await ipcInvoke<string>('get-game-media-path', gameId, type)

          if (mediaPath) {
            setMediaData(gameId, type, {
              protocol: defaultProtocol,
              path: mediaPath
            })
          } else {
            throw new Error(`No media path found for game ${gameId} ${type}`)
          }
        } catch (error) {
          console.error('Failed to update media:', error)
          setError(error instanceof Error ? error : new Error('Unknown error'))
          if (error instanceof Error) {
            toast.error(`Failed to update media: ${error.message}`)
          }
        } finally {
          setIsLoading(false)
        }
      }
    }

    const removeListener = ipcOnUnique('reload-db-value', updateListener)
    return removeListener
  }, [gameId, type, defaultProtocol])

  // 构建多媒体 URL
  const mediaUrl = useMemo(() => {
    if (!currentMediaData) return undefined
    // 将反斜杠转换为正斜杠，确保 URL 格式正确
    const normalizedPath = currentMediaData.path.replace(/\\/g, '/')
    return `${defaultProtocol}:///${normalizedPath}?t=${currentMediaData.timestamp}`
  }, [currentMediaData])

  // 手动刷新多媒体（更新时间戳）
  const refreshMedia = (): void => {
    updateTimestamp(gameId, type)
  }

  return {
    mediaUrl,
    isLoading,
    error,
    refreshMedia
  }
}

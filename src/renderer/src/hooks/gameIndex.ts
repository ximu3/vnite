import { useState, useEffect, useCallback, useMemo } from 'react'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { GameIndexdata, gameIndexdataKeys } from './types'

interface GameIndexManagerHook {
  gameIndex: Map<string, Partial<GameIndexdata>>
  rebuildIndex: () => Promise<void>
  search: (query: string) => string[]
  sort: (by: string, order?: 'asc' | 'desc') => string[]
  filter: (criteria: Record<string, string[]>) => string[]
  getAllValuesInKey: (key: string) => string[]
  checkGameExists: (gameId: string) => Promise<boolean>
  deleteGame: (gameId: string) => Promise<void>
}

export function useGameIndexManager(): GameIndexManagerHook {
  const [gameIndex, setGameIndex] = useState<Map<string, Partial<GameIndexdata>>>(new Map())

  const buildIndex = useCallback(
    (
      metadata: Record<string, GameIndexdata>,
      fieldsToIndex: string[]
    ): Map<string, Partial<GameIndexdata>> => {
      const newIndex = new Map<string, Partial<GameIndexdata>>()

      for (const [gameId, data] of Object.entries(metadata)) {
        const indexedData: Partial<GameIndexdata> = {}
        fieldsToIndex.forEach((field) => {
          if (data[field] !== undefined) {
            indexedData[field] = data[field]
          }
        })
        newIndex.set(gameId, indexedData)
      }

      return newIndex
    },
    []
  )

  const rebuildIndex = useCallback(async () => {
    try {
      const metadata: Record<string, GameIndexdata> = await ipcInvoke('get-games-metadata')
      const newIndex = buildIndex(metadata, gameIndexdataKeys)
      setGameIndex(newIndex)
      console.log('Index rebuilt:', newIndex)
    } catch (error) {
      console.error('Error rebuilding index:', error)
      throw error
    }
  }, [buildIndex])

  useEffect(() => {
    rebuildIndex()
    const unsubscribe = ipcOnUnique('rebuild-index', rebuildIndex)
    return (): void => {
      unsubscribe()
    }
  }, [rebuildIndex])

  const search = useCallback(
    (query: string): string[] => {
      const results: string[] = []
      const lowercaseQuery = query.toLowerCase()

      for (const [gameId, metadata] of gameIndex) {
        const matchFound = Object.values(metadata).some(
          (value) => value && value.toString().toLowerCase().includes(lowercaseQuery)
        )

        if (matchFound) {
          results.push(gameId)
        }
      }

      return results
    },
    [gameIndex]
  )

  const sort = useCallback(
    (by: string, order: 'asc' | 'desc' = 'asc'): string[] => {
      const results = Array.from(gameIndex.keys())
      results.sort((a, b) => {
        const valueA = gameIndex.get(a)?.[by]
        const valueB = gameIndex.get(b)?.[by]

        if (valueA === undefined && valueB === undefined) {
          return 0
        }

        if (valueA === undefined) {
          return order === 'asc' ? 1 : -1
        }

        if (valueB === undefined) {
          return order === 'asc' ? -1 : 1
        }

        if (valueA === valueB) {
          return 0
        }

        return order === 'asc' ? (valueA > valueB ? 1 : -1) : valueA > valueB ? -1 : 1
      })

      return results
    },
    [gameIndex]
  )

  const filter = useCallback(
    (criteria: Record<string, string[]>): string[] => {
      const results: string[] = []

      for (const [gameId, metadata] of gameIndex) {
        const matchesAllCriteria = Object.entries(criteria).every(([field, values]) => {
          const metadataValue = metadata[field]

          // 处理日期区间过滤
          if (
            field === 'releaseDate' &&
            Array.isArray(values) &&
            values.length === 2 &&
            metadataValue
          ) {
            const [start, end] = values

            // 验证日期格式和有效性
            const isValidDate = (dateStr: string): boolean => {
              const date = new Date(dateStr)
              return date instanceof Date && !isNaN(date.getTime())
            }

            // 检查所有日期是否有效
            if (
              !isValidDate(start) ||
              !isValidDate(end) ||
              !isValidDate(metadataValue.toString())
            ) {
              return false
            }

            const releaseDate = new Date(metadataValue.toString())
            const startDate = new Date(start)
            const endDate = new Date(end)

            // 检查日期区间是否有效（开始日期不能晚于结束日期）
            if (startDate > endDate) {
              return false
            }

            return releaseDate >= startDate && releaseDate <= endDate
          }
          // 处理普通数组过滤
          if (Array.isArray(metadataValue)) {
            // 如果元数据值是数组，检查是否有任何元素匹配任何条件值
            return metadataValue.some((item) =>
              values.some((value) => item.toString().toLowerCase().includes(value.toLowerCase()))
            )
          } else if (metadataValue) {
            // 如果元数据值不是数组，保持原来的逻辑
            return values.some((value) =>
              metadataValue.toString().toLowerCase().includes(value.toLowerCase())
            )
          }

          return false
        })

        if (matchesAllCriteria) {
          results.push(gameId)
        }
      }

      return results
    },
    [gameIndex]
  )

  const getAllValuesInKey = useCallback(
    (key: string): string[] => {
      const values = new Set<string>()

      for (const metadata of gameIndex.values()) {
        const value = metadata[key]
        if (Array.isArray(value)) {
          // 如果值是数组，添加所有元素
          value.forEach((item) => {
            if (item) {
              values.add(item.toString())
            }
          })
        } else if (value) {
          // 如果值不是数组，保持原来的逻辑
          values.add(value.toString())
        }
      }

      return Array.from(values)
    },
    [gameIndex]
  )

  const checkGameExists = useCallback(async (gameId: string): Promise<boolean> => {
    try {
      const metadata: Record<string, GameIndexdata> = await ipcInvoke('get-games-metadata')
      return metadata[gameId] !== undefined
    } catch (error) {
      console.error('Error checking if game exists:', error)
      throw error
    }
  }, [])

  const deleteGame = useCallback(
    async (gameId: string): Promise<void> => {
      try {
        const updatedIndex = new Map(gameIndex)
        updatedIndex.delete(gameId)
        setGameIndex(updatedIndex)
      } catch (error) {
        console.error('Error deleting game:', error)
        throw error
      }
    },
    [gameIndex]
  )

  return useMemo(
    (): GameIndexManagerHook => ({
      gameIndex,
      rebuildIndex,
      search,
      sort,
      filter,
      getAllValuesInKey,
      checkGameExists,
      deleteGame
    }),
    [gameIndex, rebuildIndex, search, filter, getAllValuesInKey]
  )
}

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ipcInvoke, ipcOnUnique } from '~/utils'
import { GameIndexdata, gameIndexdataKeys } from './types'

interface GameIndexManagerHook {
  gameIndex: Map<string, Partial<GameIndexdata>>
  rebuildIndex: () => Promise<void>
  search: (query: string) => string[]
  filter: (criteria: Record<string, string[]>) => string[]
  getAllValuesInKey: (key: string) => string[]
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

  const filter = useCallback(
    (criteria: Record<string, string[]>): string[] => {
      const results: string[] = []

      for (const [gameId, metadata] of gameIndex) {
        const matchesAllCriteria = Object.entries(criteria).every(([field, values]) => {
          const metadataValue = metadata[field]
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

  return useMemo(
    (): GameIndexManagerHook => ({
      gameIndex,
      rebuildIndex,
      search,
      filter,
      getAllValuesInKey
    }),
    [gameIndex, rebuildIndex, search, filter, getAllValuesInKey]
  )
}

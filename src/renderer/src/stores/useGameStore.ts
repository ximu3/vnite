import { create } from 'zustand'
import { ipcInvoke } from '~/utils'
import { getValueByPath, setValueByPath, calculateDailyPlayTime } from '@appUtils'
import {
  DocChange,
  gameDocs,
  gameDoc,
  DEFAULT_GAME_VALUES,
  MaxPlayTimeDay
} from '@appTypes/database'
import type { Get, Paths } from 'type-fest'

export interface GameState {
  documents: gameDocs
  initialized: boolean
  setDocuments: (data: gameDocs) => void
  search: (query: string) => string[]
  sort: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    by: Path,
    order?: 'asc' | 'desc'
  ) => string[]
  filter: (
    criteria: Partial<Record<Paths<gameDoc, { bracketNotation: true }>, string[]>>
  ) => string[]
  getAllValuesInKey: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    path: Path
  ) => string[]
  checkGameExists: (gameId: string) => Promise<boolean>
  getGameValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ) => Get<gameDoc, Path>
  setGameValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameDoc, Path>
  ) => Promise<void>
  initializeStore: (data: GameState['documents']) => void
  setDocument: (docId: string, data: gameDoc) => void

  getGameplayTime: (gameId: string) => number
  getGameplayTimeFormatted: (gameId: string) => string
  getGamePlayTimeByDateRange: (
    gameId: string,
    startDate: string,
    endDate: string
  ) => { [date: string]: number }
  getGamePlayDays: (gameId: string) => number
  getGameMaxPlayTimeDay: (gameId: string) => MaxPlayTimeDay | null
  getGameRecord: (gameId: string) => gameDoc['record']
  getGameStartAndEndDate: (gameId: string) => { start: string; end: string }
  getSortedGameIds: (order: 'asc' | 'desc') => string[]
  getMaxOrdinalGameId: () => string | null
  getPlayedDaysYearly: () => { [date: string]: number }
  getTotalplayTimeYearly: () => number
  getTotalplayTime: () => number
  getTotalPlayedTimes: () => number
  getTotalPlayedDays: () => number
  getSortedGameByPlayedTimes: (order: 'asc' | 'desc') => string[]
}

const updateDocument = async (docId: string, data: gameDoc): Promise<void> => {
  const change: DocChange = {
    dbName: 'game',
    docId,
    data,
    timestamp: Date.now()
  }

  try {
    await ipcInvoke('db-changed', change)
  } catch (error) {
    console.error('Failed to sync with database:', error)
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  documents: {} as gameDocs,
  initialized: false,

  setDocuments: (data: gameDocs): void => {
    set({ documents: data })
  },

  setDocument: (docId: string, data: gameDoc): void => {
    set((state) => ({
      documents: {
        ...state.documents,
        [docId]: data
      }
    }))
  },

  getGameValue: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path
  ): Get<gameDoc, Path> => {
    const state = get()
    if (!state.initialized) {
      return getValueByPath(DEFAULT_GAME_VALUES, path)
    }

    const doc = state.documents[gameId]
    if (!doc) {
      return getValueByPath(DEFAULT_GAME_VALUES, path)
    }

    const value = getValueByPath(doc, path)
    return value !== undefined ? value : getValueByPath(DEFAULT_GAME_VALUES, path)
  },

  // 设置游戏特定路径的值
  setGameValue: async <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    gameId: string,
    path: Path,
    value: Get<gameDoc, Path>
  ): Promise<void> => {
    const doc = get().documents[gameId]
    setValueByPath(doc, path, value)
    set((state) => ({
      documents: {
        ...state.documents,
        [gameId]: doc
      }
    }))

    // 然后异步更新文档
    await updateDocument(gameId, get().documents[gameId])
  },

  initializeStore: (data): void =>
    set({
      documents: data,
      initialized: true
    }),
  search: (query: string): string[] => {
    const { documents } = get()
    const results: string[] = []
    const lowercaseQuery = query.toLowerCase()

    // 安全的遍历方式
    for (const gameId in documents) {
      try {
        const game = documents[gameId]

        // 检查 game 和 metadata 是否存在
        if (!game || !game.metadata) continue

        // 安全地获取并处理 metadata 的值
        const metadataValues = Object.values(game.metadata || {})
        const matchFound = metadataValues.some((value) => {
          // 确保值存在且可转为字符串
          if (value == null) return false
          try {
            return value.toString().toLowerCase().includes(lowercaseQuery)
          } catch (e) {
            console.warn(`Error converting value to string in game ${gameId}:`, e)
            return false
          }
        })

        if (matchFound) {
          results.push(gameId)
        }
      } catch (error) {
        console.error(`Error processing game ${gameId} during search:`, error)
        // 继续处理下一个游戏，不中断搜索
      }
    }

    return results
  },
  sort: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    by: Path,
    order?: 'asc' | 'desc'
  ): string[] => {
    const { documents } = get()

    return Object.entries(documents)
      .sort(([, a], [, b]) => {
        const valueA = getValueByPath(a, by)
        const valueB = getValueByPath(b, by)

        if (valueA == null && valueB == null) {
          return 0
        }
        if (valueA == null) {
          return order === 'asc' ? 1 : -1
        }
        if (valueB == null) {
          return order === 'asc' ? -1 : 1
        }
        if (valueA === valueB) {
          return 0
        }

        // 比较逻辑
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          if (by === 'metadata.name') {
            return order === 'asc'
              ? valueA.localeCompare(valueB, 'zh-CN')
              : valueB.localeCompare(valueA, 'zh-CN')
          } else {
            return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
          }
        } else if (typeof valueA === 'number' && typeof valueB === 'number') {
          return order === 'asc' ? valueA - valueB : valueB - valueA
        } else {
          // 如果类型不明确，可以尝试转换为字符串进行比较
          const strA = String(valueA)
          const strB = String(valueB)
          return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
        }
      })
      .map(([gameId]) => gameId)
  },
  filter: (
    criteria: Partial<Record<Paths<gameDoc, { bracketNotation: true }>, string[]>>
  ): string[] => {
    try {
      const { documents } = get()
      const results: string[] = []

      for (const gameId in documents) {
        try {
          const game = documents[gameId]
          if (!game) continue

          let matchesAllCriteria = true

          for (const [path, values] of Object.entries(criteria)) {
            try {
              if (!Array.isArray(values) || values.length === 0) continue

              const metadataValue = getValueByPath(game, path)

              if (
                path === 'metadata.releaseDate' &&
                Array.isArray(values) &&
                values.length === 2 &&
                metadataValue
              ) {
                const [start, end] = values
                const isValidDate = (dateStr: string): boolean => {
                  try {
                    const date = new Date(dateStr)
                    return date instanceof Date && !isNaN(date.getTime())
                  } catch {
                    return false
                  }
                }

                if (
                  !isValidDate(start) ||
                  !isValidDate(end) ||
                  !isValidDate(metadataValue.toString())
                ) {
                  matchesAllCriteria = false
                  break
                }

                try {
                  const releaseDate = new Date(metadataValue.toString())
                  const startDate = new Date(start)
                  const endDate = new Date(end)

                  if (startDate > endDate) {
                    matchesAllCriteria = false
                    break
                  }

                  if (!(releaseDate >= startDate && releaseDate <= endDate)) {
                    matchesAllCriteria = false
                    break
                  }
                } catch (error) {
                  console.error(`Date comparison error for ${gameId}:`, error)
                  matchesAllCriteria = false
                  break
                }
              } else {
                // 处理其他类型的过滤
                let matches = false

                if (Array.isArray(metadataValue)) {
                  try {
                    matches = metadataValue.some(
                      (item) =>
                        item != null &&
                        values.some((value) =>
                          item.toString().toLowerCase().includes(value.toLowerCase())
                        )
                    )
                  } catch (error) {
                    console.error(`Array filtering error for ${gameId}:`, error)
                    matches = false
                  }
                } else if (metadataValue != null) {
                  try {
                    matches = values.some((value) =>
                      metadataValue.toString().toLowerCase().includes(value.toLowerCase())
                    )
                  } catch (error) {
                    console.error(`Value filtering error for ${gameId}:`, error)
                    matches = false
                  }
                }

                if (!matches) {
                  matchesAllCriteria = false
                  break
                }
              }
            } catch (error) {
              console.error(`Error processing criteria ${path} for ${gameId}:`, error)
              matchesAllCriteria = false
              break
            }
          }

          if (matchesAllCriteria) {
            results.push(gameId)
          }
        } catch (error) {
          console.error(`Error processing game ${gameId} during filtering:`, error)
          continue
        }
      }

      return results
    } catch (error) {
      console.error('Fatal error in filter function:', error)
      return []
    }
  },
  getAllValuesInKey: <Path extends Paths<gameDoc, { bracketNotation: true }>>(
    path: Path
  ): string[] => {
    try {
      const { documents } = get()
      const values = new Set<string>()

      for (const gameId in documents) {
        try {
          const game = documents[gameId]
          if (!game) continue

          let value: any
          try {
            value = getValueByPath(game, path)
          } catch (error) {
            console.error(`Error getting value at path ${String(path)} for game ${gameId}:`, error)
            continue
          }

          if (Array.isArray(value)) {
            try {
              value.forEach((item) => {
                if (item != null) {
                  values.add(item.toString())
                }
              })
            } catch (error) {
              console.error(`Error processing array values for ${gameId}:`, error)
            }
          } else if (value != null) {
            try {
              values.add(value.toString())
            } catch (error) {
              console.error(`Error converting value to string for ${gameId}:`, error)
            }
          }
        } catch (error) {
          console.error(`Error processing game ${gameId}:`, error)
          continue
        }
      }

      return Array.from(values)
    } catch (error) {
      console.error('Fatal error in getAllValuesInKey:', error)
      return []
    }
  },
  checkGameExists: async (gameId): Promise<boolean> => {
    try {
      const metadata: Record<string, gameDoc['metadata']> = await ipcInvoke('get-games-metadata')
      return metadata[gameId] !== undefined
    } catch (error) {
      console.error('Error checking if game exists:', error)
      throw error
    }
  },
  getGameplayTime: (gameId): number => {
    try {
      const { documents } = get()
      if (!documents[gameId] || !documents[gameId]?.record) {
        return 0
      }
      return documents[gameId].record?.playTime || 0
    } catch (error) {
      console.error(`Error in getGameplayTime for ${gameId}:`, error)
      return 0
    }
  },
  getGameplayTimeFormatted: (gameId): string => {
    try {
      const playTime = get().getGameplayTime(gameId)

      const hours = Math.floor(playTime / 3600000)
      const minutes = Math.floor((playTime % 3600000) / 60000)
      const seconds = Math.floor((playTime % 60000) / 1000)

      if (hours >= 1) {
        const fractionalHours = (playTime / 3600000).toFixed(1)
        return `${fractionalHours} h`
      } else if (minutes >= 1) {
        return `${minutes} min`
      } else {
        return `${seconds} s`
      }
    } catch (error) {
      console.error(`Error in getGameplayTimeFormatted for ${gameId}:`, error)
      return '0 s'
    }
  },
  getGamePlayTimeByDateRange: (
    gameId,
    startDate,
    endDate
  ): {
    [date: string]: number
  } => {
    try {
      const { documents } = get()
      const game = documents[gameId]
      if (!game?.record?.timers || game.record.timers.length === 0) {
        return {}
      }

      try {
        const start = new Date(startDate)
        const end = new Date(endDate)

        // 验证日期
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.error(`Invalid date range: ${startDate} to ${endDate}`)
          return {}
        }

        const result: { [date: string]: number } = {}
        const current = new Date(start)

        while (current <= end) {
          try {
            const dateStr = current.toISOString().split('T')[0]
            result[dateStr] = calculateDailyPlayTime(current, game.record.timers)
            current.setDate(current.getDate() + 1)
          } catch (error) {
            console.error(`Error processing date in getGamePlayTimeByDateRange:`, error)
            current.setDate(current.getDate() + 1)
          }
        }

        return result
      } catch (error) {
        console.error(`Error in date range processing for ${gameId}:`, error)
        return {}
      }
    } catch (error) {
      console.error(`Fatal error in getGamePlayTimeByDateRange for ${gameId}:`, error)
      return {}
    }
  },
  getGamePlayDays: (gameId): number => {
    const { documents } = get()
    const game = documents[gameId]

    if (!game?.record?.timers || game.record.timers.length === 0) {
      return 0
    }

    const playDays = new Set<string>()

    game.record.timers.forEach((timer) => {
      // Convert to time in the user's local time zone
      const start = new Date(timer.start)
      const end = new Date(timer.end)

      // Get a date string in the local time zone
      const startDay = start.toLocaleDateString()
      const endDay = end.toLocaleDateString()

      if (startDay === endDay) {
        playDays.add(startDay)
      } else {
        const current = new Date(start)
        // Set to the start time of the day (local time zone)
        current.setHours(0, 0, 0, 0)

        while (current <= end) {
          playDays.add(current.toLocaleDateString())
          current.setDate(current.getDate() + 1)
        }
      }
    })

    return playDays.size
  },
  getGameMaxPlayTimeDay: (gameId): MaxPlayTimeDay | null => {
    const { documents } = get()
    const game = documents[gameId]
    if (!game?.record?.timers || game.record.timers.length === 0) {
      return null
    }

    const allDates = new Set<string>()
    game.record.timers.forEach((timer) => {
      const start = new Date(timer.start)
      const end = new Date(timer.end)
      const current = new Date(start)

      while (current <= end) {
        allDates.add(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
    })

    let maxDate = ''
    let maxTime = 0

    allDates.forEach((dateStr) => {
      const currentDate = new Date(dateStr)
      const playTime = calculateDailyPlayTime(currentDate, game.record.timers)

      if (playTime > maxTime) {
        maxDate = dateStr
        maxTime = playTime
      }
    })

    return maxDate ? { date: maxDate, playTime: maxTime } : null
  },
  getGameRecord: (gameId): gameDoc['record'] => {
    const { documents } = get()
    return (
      documents[gameId]?.record || {
        addDate: '',
        lastRunDate: '',
        score: 0,
        playTime: 0,
        playStatus: 'unplayed',
        timers: []
      }
    )
  },
  getGameStartAndEndDate: (
    gameId
  ): {
    start: string
    end: string
  } => {
    const { documents } = get()
    const game = documents[gameId]
    if (!game?.record?.timers || game.record.timers.length === 0) {
      return { start: '', end: '' }
    }

    const formatDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const start = new Date(game.record.timers[0].start)
    const end = new Date(game.record.timers[game.record.timers.length - 1].end)

    return {
      start: formatDate(start),
      end: formatDate(end)
    }
  },
  getSortedGameIds: (order): string[] => {
    const { documents } = get()

    return Object.keys(documents).sort((a, b) => {
      const timeA = documents[a]?.record?.playTime || 0
      const timeB = documents[b]?.record?.playTime || 0

      if (timeA < timeB) {
        return order === 'asc' ? -1 : 1
      } else if (timeA > timeB) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  },
  getMaxOrdinalGameId: (): string | null => {
    const { documents } = get()
    let maxPlayedTimes = 0
    let maxOrdinalGameId: string | null = null

    Object.entries(documents).forEach(([gameId, game]) => {
      if (!game?.record?.timers) return
      if (game.record.timers && game.record.timers.length > maxPlayedTimes) {
        maxPlayedTimes = game.record.timers.length
        maxOrdinalGameId = gameId
      }
    })

    return maxOrdinalGameId
  },
  getPlayedDaysYearly: (): {
    [date: string]: number
  } => {
    const { documents } = get()
    const currentDate = new Date()
    const lastYearDate = new Date(currentDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)

    const result: { [date: string]: number } = {}
    const current = new Date(currentDate)
    const datesArray: { date: string; playTime: number }[] = []

    while (current.getTime() >= lastYearDate.getTime()) {
      const dateStr = current.toLocaleDateString('en-CA')
      let playTime = 0
      Object.values(documents).forEach((game) => {
        if (!game?.record?.timers) return
        playTime += calculateDailyPlayTime(current, game.record.timers)
      })

      datesArray.push({ date: dateStr, playTime })
      current.setDate(current.getDate() - 1)
    }

    datesArray.sort((a, b) => a.date.localeCompare(b.date))
    datesArray.forEach(({ date, playTime }) => {
      result[date] = playTime
    })

    return result
  },
  getTotalplayTimeYearly: (): number => {
    const { documents } = get()
    const currentDate = new Date()
    const lastYearDate = new Date(currentDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)

    let totalPlayTime = 0
    const current = new Date(currentDate)

    while (current.getTime() >= lastYearDate.getTime()) {
      Object.values(documents).forEach((game) => {
        if (!game?.record?.timers) return
        totalPlayTime += calculateDailyPlayTime(current, game.record.timers)
      })
      current.setDate(current.getDate() - 1)
    }

    return totalPlayTime
  },
  getTotalplayTime: (): number => {
    const { documents } = get()
    return Object.values(documents).reduce((total, game) => {
      if (!game?.record?.playTime) return total
      return total + (game.record?.playTime || 0)
    }, 0)
  },
  getTotalPlayedTimes: (): number => {
    const { documents } = get()
    return Object.values(documents).reduce((total, game) => {
      if (!game?.record?.timers) return total
      return total + (game.record?.timers?.length || 0)
    }, 0)
  },
  getTotalPlayedDays: (): number => {
    const { documents } = get()
    return Object.keys(documents).reduce((total, gameId) => {
      if (!documents[gameId]?.record?.timers) return total
      return total + get().getGamePlayDays(gameId)
    }, 0)
  },
  getSortedGameByPlayedTimes: (order): string[] => {
    const { documents } = get()
    return Object.keys(documents).sort((a, b) => {
      const timesA = documents[a]?.record?.timers?.length || 0
      const timesB = documents[b]?.record?.timers?.length || 0

      if (timesA < timesB) {
        return order === 'asc' ? -1 : 1
      } else if (timesA > timesB) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  }
}))

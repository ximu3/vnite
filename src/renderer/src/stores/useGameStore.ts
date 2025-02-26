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
  search: (query: string) => string[]
  sort: (by: keyof gameDoc['metadata'], order?: 'asc' | 'desc') => string[]
  filter: (criteria: Partial<gameDoc['metadata']>) => string[]
  getAllValuesInKey: (key: keyof gameDoc['metadata']) => string[]
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
    for (const [gameId, game] of Object.entries(documents)) {
      const matchFound = Object.values(game.metadata).some(
        (value) => value && value.toString().toLowerCase().includes(lowercaseQuery)
      )
      if (matchFound) {
        results.push(gameId)
      }
    }
    return results
  },
  sort: (by: keyof gameDoc['metadata'], order: 'asc' | 'desc' = 'asc'): string[] => {
    const { documents } = get()
    return Object.entries(documents)
      .sort(([, a], [, b]) => {
        const valueA = a.metadata[by]
        const valueB = b.metadata[by]

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
        if (by === 'name') {
          return order === 'asc'
            ? (valueA as string).localeCompare(valueB as string, 'zh-CN')
            : (valueB as string).localeCompare(valueA as string, 'zh-CN')
        } else {
          return order === 'asc'
            ? (valueA as string) > (valueB as string)
              ? 1
              : -1
            : (valueA as string) > (valueB as string)
              ? -1
              : 1
        }
      })
      .map(([gameId]) => gameId)
  },
  filter: (criteria: Partial<gameDoc['metadata']>): string[] => {
    const { documents } = get()
    const results: string[] = []
    for (const [gameId, game] of Object.entries(documents)) {
      const matchesAllCriteria = Object.entries(criteria).every(([field, values]) => {
        const metadataValue = game.metadata[field as keyof gameDoc['metadata']]
        if (
          field === 'releaseDate' &&
          Array.isArray(values) &&
          values.length === 2 &&
          metadataValue
        ) {
          const [start, end] = values
          const isValidDate = (dateStr: string): boolean => {
            const date = new Date(dateStr)
            return date instanceof Date && !isNaN(date.getTime())
          }
          if (!isValidDate(start) || !isValidDate(end) || !isValidDate(metadataValue.toString())) {
            return false
          }
          const releaseDate = new Date(metadataValue.toString())
          const startDate = new Date(start)
          const endDate = new Date(end)
          if (startDate > endDate) {
            return false
          }
          return releaseDate >= startDate && releaseDate <= endDate
        }
        if (Array.isArray(metadataValue)) {
          return metadataValue.some((item) =>
            (values as string[]).some((value) =>
              item.toString().toLowerCase().includes(value.toLowerCase())
            )
          )
        } else if (metadataValue) {
          return (values as string[]).some((value) =>
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
  getAllValuesInKey: (key: keyof gameDoc['metadata']): string[] => {
    const { documents } = get()
    const values = new Set<string>()
    for (const game of Object.values(documents)) {
      const value = game.metadata[key]
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) {
            values.add(item.toString())
          }
        })
      } else if (value) {
        values.add(value.toString())
      }
    }
    return Array.from(values)
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
    const { documents } = get()
    return documents[gameId]?.record?.playTime || 0
  },
  getGameplayTimeFormatted: (gameId): string => {
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
  },
  getGamePlayTimeByDateRange: (
    gameId,
    startDate,
    endDate
  ): {
    [date: string]: number
  } => {
    const { documents } = get()
    const game = documents[gameId]
    if (!game?.record?.timers || game.record.timers.length === 0) {
      return {}
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const result: { [date: string]: number } = {}
    const current = new Date(start)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      result[dateStr] = calculateDailyPlayTime(current, game.record.timers)
      current.setDate(current.getDate() + 1)
    }

    return result
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
        totalPlayTime += calculateDailyPlayTime(current, game.record.timers)
      })
      current.setDate(current.getDate() - 1)
    }

    return totalPlayTime
  },
  getTotalplayTime: (): number => {
    const { documents } = get()
    return Object.values(documents).reduce((total, game) => {
      return total + (game.record?.playTime || 0)
    }, 0)
  },
  getTotalPlayedTimes: (): number => {
    const { documents } = get()
    return Object.values(documents).reduce((total, game) => {
      return total + (game.record?.timers?.length || 0)
    }, 0)
  },
  getTotalPlayedDays: (): number => {
    const { documents } = get()
    return Object.keys(documents).reduce((total, gameId) => {
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

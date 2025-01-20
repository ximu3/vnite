import { create } from 'zustand'
import { ipcInvoke, ipcOnUnique } from '~/utils'

// 类型定义
interface Timer {
  start: string
  end: string
}

interface Record {
  playingTime: number
  timer: Timer[]
}

interface MaxPlayTimeDay {
  date: string
  playingTime: number
}

interface GameRecords {
  [gameId: string]: Record
}

interface GameRecordsState {
  records: GameRecords
  setRecords: (records: GameRecords) => void
  getGamePlayingTime: (gameId: string) => number
  getGamePlayingTimeFormatted: (gameId: string) => string
  getGamePlayTimeByDateRange: (
    gameId: string,
    startDate: string,
    endDate: string
  ) => { [date: string]: number }
  getGamePlayDays: (gameId: string) => number
  getGameMaxPlayTimeDay: (gameId: string) => MaxPlayTimeDay | null
  getGameRecord: (gameId: string) => Record
  getGameStartAndEndDate: (gameId: string) => { start: string; end: string }
  getSortedGameIds: (order: 'asc' | 'desc') => string[]
  getMaxOrdinalGameId: () => string | null
  getPlayedDaysYearly: () => { [date: string]: number }
  getTotalPlayingTimeYearly: () => number
  getTotalPlayingTime: () => number
  getTotalPlayedTimes: () => number
  getTotalPlayedDays: () => number
  getSortedGameByPlayedTimes: (order: 'asc' | 'desc') => string[]
}

// helper function
const calculateDailyPlayTime = (date: Date, record: Record): number => {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  if (!record.timer || record.timer.length === 0) {
    return 0
  }

  return record.timer.reduce((totalPlayTime, timer) => {
    const timerStart = new Date(timer.start)
    const timerEnd = new Date(timer.end)

    if (timerStart <= dayEnd && timerEnd >= dayStart) {
      const overlapStart = Math.max(dayStart.getTime(), timerStart.getTime())
      const overlapEnd = Math.min(dayEnd.getTime(), timerEnd.getTime())
      return totalPlayTime + (overlapEnd - overlapStart)
    }

    return totalPlayTime
  }, 0)
}

export const useGameRecords = create<GameRecordsState>((set, get) => ({
  records: {},

  setRecords: (records): void => {
    if (records && typeof records === 'object') {
      set({ records: { ...records } })
    } else {
      console.warn('Attempted to set invalid records:', records)
      set({ records: {} })
    }
  },

  getGamePlayingTime: (gameId): number => {
    const { records } = get()
    return records[gameId]?.playingTime || 0
  },

  getGamePlayingTimeFormatted: (gameId): string => {
    const playingTime = get().getGamePlayingTime(gameId)
    const hours = Math.floor(playingTime / 3600000)
    const minutes = Math.floor((playingTime % 3600000) / 60000)
    const seconds = Math.floor((playingTime % 60000) / 1000)

    if (hours >= 1) {
      const fractionalHours = (playingTime / 3600000).toFixed(1)
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
    const { records } = get()
    const gameRecord = records[gameId]
    if (!gameRecord?.timer || gameRecord.timer.length === 0) {
      return {}
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const result: { [date: string]: number } = {}
    const current = new Date(start)

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      result[dateStr] = calculateDailyPlayTime(current, gameRecord)
      current.setDate(current.getDate() + 1)
    }

    return result
  },

  getGamePlayDays: (gameId): number => {
    const { records } = get()
    const gameRecord = records[gameId]

    if (!gameRecord?.timer || gameRecord.timer.length === 0) {
      return 0
    }

    const playDays = new Set<string>()

    gameRecord.timer.forEach((timer) => {
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
    const { records } = get()
    const gameRecord = records[gameId]
    if (!gameRecord?.timer || gameRecord.timer.length === 0) {
      return null
    }

    const allDates = new Set<string>()
    gameRecord.timer.forEach((timer) => {
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
      const playTime = calculateDailyPlayTime(currentDate, gameRecord)

      if (playTime > maxTime) {
        maxDate = dateStr
        maxTime = playTime
      }
    })

    return maxDate ? { date: maxDate, playingTime: maxTime } : null
  },

  getGameRecord: (gameId): Record => {
    const { records } = get()
    return records[gameId] || { playingTime: 0, timer: [] }
  },

  getGameStartAndEndDate: (
    gameId
  ): {
    start: string
    end: string
  } => {
    const { records } = get()
    const gameRecord = records[gameId]
    if (!gameRecord?.timer || gameRecord.timer.length === 0) {
      return { start: '', end: '' }
    }

    const formatDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const start = new Date(gameRecord.timer[0].start)
    const end = new Date(gameRecord.timer[gameRecord.timer.length - 1].end)

    return {
      start: formatDate(start),
      end: formatDate(end)
    }
  },

  getSortedGameIds: (order): string[] => {
    const { records } = get()
    const getPlayingTime = get().getGamePlayingTime

    return Object.keys(records).sort((a, b) => {
      const timeA = getPlayingTime(a)
      const timeB = getPlayingTime(b)

      if (timeA < timeB) {
        return order === 'asc' ? -1 : 1
      } else if (timeA > timeB) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  },

  getMaxOrdinalGameId: (): string | null => {
    const { records } = get()
    let maxPlayedTimes = 0
    let maxOrdinalGameId: string | null = null

    Object.entries(records).forEach(([gameId, record]) => {
      if (record.timer && record.timer.length > maxPlayedTimes) {
        maxPlayedTimes = record.timer.length
        maxOrdinalGameId = gameId
      }
    })

    return maxOrdinalGameId
  },

  getPlayedDaysYearly: (): {
    [date: string]: number
  } => {
    const { records } = get()
    const currentDate = new Date()
    const lastYearDate = new Date(currentDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)

    const result: { [date: string]: number } = {}
    const current = new Date(currentDate)
    const datesArray: { date: string; playTime: number }[] = []

    while (current.getTime() >= lastYearDate.getTime()) {
      const dateStr = current.toISOString().split('T')[0]
      const playTime = Object.values(records).reduce((total, record) => {
        return total + calculateDailyPlayTime(current, record)
      }, 0)

      datesArray.push({ date: dateStr, playTime })
      current.setDate(current.getDate() - 1)
    }

    datesArray.sort((a, b) => a.date.localeCompare(b.date))
    datesArray.forEach(({ date, playTime }) => {
      result[date] = playTime
    })

    return result
  },

  getTotalPlayingTimeYearly: (): number => {
    const { records } = get()
    const currentDate = new Date()
    const lastYearDate = new Date(currentDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)

    const current = new Date(currentDate)
    let totalPlayTime = 0

    while (current.getTime() >= lastYearDate.getTime()) {
      totalPlayTime += Object.values(records).reduce((total, record) => {
        return total + calculateDailyPlayTime(current, record)
      }, 0)
      current.setDate(current.getDate() - 1)
    }

    return totalPlayTime
  },

  getTotalPlayingTime: (): number => {
    const { records } = get()
    return Object.values(records).reduce((total, record) => {
      return total + (record.playingTime || 0)
    }, 0)
  },

  getTotalPlayedTimes: (): number => {
    const { records } = get()
    return Object.values(records).reduce((total, record) => {
      return total + (record.timer?.length || 0)
    }, 0)
  },

  getTotalPlayedDays: (): number => {
    const { records } = get()
    return Object.keys(records).reduce((total, gameId) => {
      return total + get().getGamePlayDays(gameId)
    }, 0)
  },

  getSortedGameByPlayedTimes: (order): string[] => {
    const { records } = get()
    return Object.keys(records).sort((a, b) => {
      const timesA = records[a]?.timer?.length || 0
      const timesB = records[b]?.timer?.length || 0

      if (timesA < timesB) {
        return order === 'asc' ? -1 : 1
      } else if (timesA > timesB) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  }
}))

// Initialize record data
ipcInvoke('get-games-record-data')
  .then((records) => {
    if (records && typeof records === 'object') {
      useGameRecords.getState().setRecords(records as GameRecords)
    } else {
      console.error('Invalid initial records received:', records)
      useGameRecords.getState().setRecords({})
    }
  })
  .catch((error) => {
    console.error('Failed to initialize game records:', error)
    useGameRecords.getState().setRecords({})
  })

// Listening record update
ipcOnUnique('game-records-changed', () => {
  ipcInvoke('get-games-record-data')
    .then((records) => {
      if (records && typeof records === 'object') {
        useGameRecords.getState().setRecords(records as GameRecords)
      } else {
        console.error('Invalid updated records received:', records)
      }
    })
    .catch((error) => {
      console.error('Error handling record update:', error)
    })
})

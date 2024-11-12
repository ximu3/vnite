import { useState, useEffect, useCallback, useMemo } from 'react'
import { ipcInvoke, ipcOnUnique } from '~/utils'

// 定义类型
interface TimerEntry {
  start: string
  end: string
}

interface MaxPlayTimeDay {
  date: string
  playingTime: number
}

interface GameTimers {
  [gameId: string]: TimerEntry[]
}

interface GameTimersHook {
  gameTimers: GameTimers
  getGamePlayingTime: (gameId: string) => number
  getGamePlayingTimeFormatted: (gameId: string) => string
  getGamePlayTimeByDateRange: (
    gameId: string,
    startDate: string,
    endDate: string
  ) => Record<string, number>
  getGamePlayDays: (gameId: string) => number
  getGameMaxPlayTimeDay: (gameId: string) => MaxPlayTimeDay | null
  getGameTimer: (gameId: string) => TimerEntry[]
  getGameStartAndEndDate: (gameId: string) => { start: string; end: string }
  getSortedGameIds: (order: 'asc' | 'desc') => string[]
}

// 自定义 Hook
export const useGameTimers = (): GameTimersHook => {
  const [gameTimers, setGameTimers] = useState<GameTimers>({})

  // 获取计时器数据的函数
  const fetchTimers = useCallback(async (): Promise<void> => {
    try {
      const timers = (await ipcInvoke('get-games-timerdata')) as GameTimers
      setGameTimers(timers)
    } catch (error) {
      console.error('Failed to fetch games timers:', error)
    }
  }, [])

  useEffect(() => {
    // 初始化时获取数据
    fetchTimers()

    // 监听更新信号
    const handleTimerUpdate = (): void => {
      fetchTimers()
    }

    // 注册 IPC 监听器
    const removeListener = ipcOnUnique('timer-update', handleTimerUpdate)

    // 清理函数
    return (): void => {
      removeListener()
    }
  }, [fetchTimers])

  const getGamePlayingTime = useCallback(
    (gameId: string): number => {
      const gameTimer = gameTimers[gameId]
      if (!gameTimer) {
        return 0
      }

      return gameTimer.reduce((acc, timer) => {
        const startingTime = new Date(timer.start).getTime()
        const endingTime = new Date(timer.end).getTime()
        return acc + (endingTime - startingTime)
      }, 0)
    },
    [gameTimers]
  )

  const getGamePlayingTimeFormatted = useCallback(
    (gameId: string): string => {
      const playingTime = getGamePlayingTime(gameId)
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
    [getGamePlayingTime]
  )

  interface DailyPlayTime {
    [date: string]: number
  }

  const calculateDailyPlayTime = (date: Date, timers: TimerEntry[]): number => {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    return timers.reduce((totalPlayTime, timer) => {
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

  // 使用 calculateDailyPlayTime 函数来计算日期范围内的游玩时间
  const getGamePlayTimeByDateRange = useCallback(
    (gameId: string, startDate: string, endDate: string): DailyPlayTime => {
      const gameTimer = gameTimers[gameId]
      if (!gameTimer || gameTimer.length === 0) {
        return {}
      }

      const start = new Date(startDate)
      const end = new Date(endDate)
      const result: DailyPlayTime = {}
      const current = new Date(start)

      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0]
        // 直接使用指定游戏的计时器数据
        const dayPlayTime = calculateDailyPlayTime(current, gameTimer)
        result[dateStr] = dayPlayTime
        current.setDate(current.getDate() + 1)
      }

      return result
    },
    [gameTimers]
  )

  const getGamePlayDays = useCallback(
    (gameId: string): number => {
      const gameTimer = gameTimers[gameId]
      if (!gameTimer || gameTimer.length === 0) {
        return 0
      }

      // 使用 Set 来存储不重复的日期
      const playDays = new Set<string>()

      gameTimer.forEach((timer) => {
        // 获取开始时间的日期部分
        const startDay = timer.start.split('T')[0]
        // 获取结束时间的日期部分
        const endDay = timer.end.split('T')[0]

        // 如果开始和结束是同一天，只添加一次
        if (startDay === endDay) {
          playDays.add(startDay)
        } else {
          // 如果跨天，需要计算中间的所有天数
          const start = new Date(timer.start)
          const end = new Date(timer.end)
          const current = new Date(start)

          // 设置时间为当天开始
          current.setHours(0, 0, 0, 0)

          // 遍历所有涉及的天数
          while (current <= end) {
            playDays.add(current.toISOString().split('T')[0])
            current.setDate(current.getDate() + 1)
          }
        }
      })

      return playDays.size
    },
    [gameTimers]
  )

  const getGameMaxPlayTimeDay = useCallback(
    (gameId: string): MaxPlayTimeDay | null => {
      const gameTimer = gameTimers[gameId]
      if (!gameTimer || gameTimer.length === 0) {
        return null
      }

      // 获取所有游戏记录的日期范围
      const allDates = new Set<string>()
      gameTimer.forEach((timer) => {
        const start = new Date(timer.start)
        const end = new Date(timer.end)
        const current = new Date(start)

        while (current <= end) {
          allDates.add(current.toISOString().split('T')[0])
          current.setDate(current.getDate() + 1)
        }
      })

      // 使用 calculateDailyPlayTime 计算每天的游玩时间
      let maxDate = ''
      let maxTime = 0

      allDates.forEach((dateStr) => {
        const currentDate = new Date(dateStr)
        const playTime = calculateDailyPlayTime(currentDate, gameTimer)

        if (playTime > maxTime) {
          maxDate = dateStr
          maxTime = playTime
        }
      })

      if (maxDate === '') {
        return null
      }

      return {
        date: maxDate,
        playingTime: maxTime
      }
    },
    [gameTimers]
  )

  const getGameTimer = useCallback(
    (gameId: string): TimerEntry[] => {
      return gameTimers[gameId] || []
    },
    [gameTimers]
  )

  const getGameStartAndEndDate = useCallback(
    (gameId: string): { start: string; end: string } => {
      const gameTimer = gameTimers[gameId]
      if (!gameTimer || gameTimer.length === 0) {
        return { start: '', end: '' }
      }

      const formatDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const start = new Date(gameTimer[0].start)
      const end = new Date(gameTimer[gameTimer.length - 1].end)

      return {
        start: formatDate(start),
        end: formatDate(end)
      }
    },
    [gameTimers]
  )

  const getSortedGameIds = useCallback(
    (order: 'asc' | 'desc'): string[] => {
      return Object.keys(gameTimers).sort((a, b) => {
        const timeA = getGamePlayingTime(a)
        const timeB = getGamePlayingTime(b)

        if (timeA < timeB) {
          return order === 'asc' ? -1 : 1
        } else if (timeA > timeB) {
          return order === 'asc' ? 1 : -1
        }

        return 0
      })
    },
    [gameTimers, getGamePlayingTime]
  )

  return useMemo(
    () => ({
      gameTimers,
      getGamePlayingTime,
      getGamePlayingTimeFormatted,
      getGamePlayTimeByDateRange,
      getGamePlayDays,
      getGameMaxPlayTimeDay,
      getGameTimer,
      getGameStartAndEndDate,
      getSortedGameIds
    }),
    [
      gameTimers,
      getGamePlayingTime,
      getGamePlayingTimeFormatted,
      getGamePlayTimeByDateRange,
      getGamePlayDays,
      getGameMaxPlayTimeDay,
      getGameTimer,
      getGameStartAndEndDate,
      getSortedGameIds
    ]
  )
}

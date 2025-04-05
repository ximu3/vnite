import { getGameStore, useGameRegistry } from '~/stores/game'
import type { gameDoc } from '@appTypes/database'
import i18next from 'i18next'

interface WeeklyMostPlayedDay {
  date: string
  playTime: number
}

interface MonthlyMostPlayedDay {
  date: string
  playTime: number
}

interface MostPlayedMonth {
  month: number
  playTime: number
}

/**
 * Calculate the game time (in milliseconds) for a specific date
 */
export function calculateDailyPlayTime(date: Date, timers: gameDoc['record']['timers']): number {
  try {
    // Make sure we only deal with the date part and don't care about the time
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    let totalPlayTime = 0

    // Iterate over all timer records
    for (const timer of timers) {
      const start = new Date(timer.start)
      const end = new Date(timer.end)

      // If the timer record does not overlap with the target date, it is skipped
      if (end < targetDate || start >= nextDay) continue

      // Calculate overlap time
      const overlapStart = start < targetDate ? targetDate : start
      const overlapEnd = end > nextDay ? nextDay : end

      // Increase total play time
      totalPlayTime += overlapEnd.getTime() - overlapStart.getTime()
    }

    return totalPlayTime
  } catch (error) {
    console.error('Error in calculateDailyPlayTime:', error)
    return 0
  }
}

/**
 * Get play data for a given week
 */
export function getWeeklyPlayData(date = new Date()): {
  dates: string[]
  totalTime: number
  dailyPlayTime: { [date: string]: number }
  mostPlayedDay: WeeklyMostPlayedDay | null
  mostPlayedGames: { gameId: string; playTime: number }[]
} {
  try {
    // Calculate the beginning (Monday) and end (Sunday) of the week
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Generate an array of dates for the week
    const dates: string[] = []
    const current = new Date(weekStart)
    while (current <= weekEnd) {
      dates.push(i18next.format(current, 'niceISO'))
      current.setDate(current.getDate() + 1)
    }

    // Calculate daily play time
    const dailyPlayTime: { [date: string]: number } = {}
    let totalTime = 0
    let mostPlayedDay: WeeklyMostPlayedDay | null = null
    const gamePlayTime: { [gameId: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // Every day
    for (const dateStr of dates) {
      const dayDate = new Date(dateStr)
      let dayTotal = 0

      // Iterate through all the games
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []

        // Calculate the playtime of the game on this day
        const playTime = calculateDailyPlayTime(dayDate, timers)
        dayTotal += playTime

        // Accumulate the total play time for each game
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
      }

      dailyPlayTime[dateStr] = dayTotal
      totalTime += dayTotal

      // Update the day you play the most games
      if (mostPlayedDay === null || dayTotal > mostPlayedDay.playTime) {
        mostPlayedDay = {
          date: dateStr,
          playTime: dayTotal
        }
      }
    }

    // Get the most played games (in order of time)
    const mostPlayedGames = Object.entries(gamePlayTime)
      .map(([gameId, playTime]) => ({ gameId, playTime }))
      .filter((item) => item.playTime > 0)
      .sort((a, b) => b.playTime - a.playTime)
      .slice(0, 3)

    return {
      dates,
      totalTime,
      dailyPlayTime,
      mostPlayedDay,
      mostPlayedGames
    }
  } catch (error) {
    console.error('Error in getWeeklyPlayData:', error)
    return {
      dates: [],
      totalTime: 0,
      dailyPlayTime: {},
      mostPlayedDay: null,
      mostPlayedGames: []
    }
  }
}

/**
 * Get play data for a given month
 */
export function getMonthlyPlayData(date = new Date()): {
  totalTime: number
  dailyPlayTime: { [date: string]: number }
  mostPlayedDay: MonthlyMostPlayedDay | null
  weeklyPlayTime: { week: number; playTime: number }[]
  mostPlayedGames: { gameId: string; playTime: number }[]
} {
  try {
    // Calculation of beginning and end of month
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

    // Generate an array of dates for this month
    const dates: string[] = []
    const current = new Date(monthStart)
    while (current <= monthEnd) {
      dates.push(i18next.format(current, 'niceISO'))
      current.setDate(current.getDate() + 1)
    }

    // Calculate daily play time
    const dailyPlayTime: { [date: string]: number } = {}
    const weeklyPlayTime: { [week: number]: number } = {}
    let totalTime = 0
    let mostPlayedDay: MonthlyMostPlayedDay | null = null
    const gamePlayTime: { [gameId: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // Every day
    for (const dateStr of dates) {
      const dayDate = new Date(dateStr)
      let dayTotal = 0

      // Calculate what week of the month the current date is
      const weekOfMonth = Math.ceil(
        (dayDate.getDate() + new Date(dayDate.getFullYear(), dayDate.getMonth(), 1).getDay()) / 7
      )

      // Iterate through all the games
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []

        // Calculate the playtime of the game on this day
        const playTime = calculateDailyPlayTime(dayDate, timers)
        dayTotal += playTime

        // Accumulate the total play time for each game
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
      }

      dailyPlayTime[dateStr] = dayTotal
      weeklyPlayTime[weekOfMonth] = (weeklyPlayTime[weekOfMonth] || 0) + dayTotal
      totalTime += dayTotal

      // Update the day when you play the most games
      if (mostPlayedDay === null || dayTotal > mostPlayedDay.playTime) {
        mostPlayedDay = {
          date: dateStr,
          playTime: dayTotal
        }
      }
    }

    // Get the most played games
    const mostPlayedGames = Object.entries(gamePlayTime)
      .map(([gameId, playTime]) => ({ gameId, playTime }))
      .filter((item) => item.playTime > 0)
      .sort((a, b) => b.playTime - a.playTime)
      .slice(0, 3)

    // Converting weekly playtime into an array
    const weeklyPlayTimeArray = Object.entries(weeklyPlayTime)
      .map(([week, playTime]) => ({ week: parseInt(week), playTime }))
      .sort((a, b) => a.week - b.week)

    return {
      totalTime,
      dailyPlayTime,
      mostPlayedDay,
      weeklyPlayTime: weeklyPlayTimeArray,
      mostPlayedGames
    }
  } catch (error) {
    console.error('Error in getMonthlyPlayData:', error)
    return {
      totalTime: 0,
      dailyPlayTime: {},
      mostPlayedDay: null,
      weeklyPlayTime: [],
      mostPlayedGames: []
    }
  }
}

/**
 * Get play data for a given year
 */
export function getYearlyPlayData(year = new Date().getFullYear()): {
  totalTime: number
  monthlyPlayTime: { month: number; playTime: number }[]
  monthlyPlayDays: { month: number; days: number }[]
  mostPlayedMonth: MostPlayedMonth | null
  mostPlayedGames: { gameId: string; playTime: number }[]
  gameTypeDistribution: { type: string; playTime: number }[]
} {
  try {
    // Calculate the beginning and end of the year
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

    const monthlyPlayTime: { [month: number]: number } = {}
    const monthlyPlayDays: { [month: number]: Set<string> } = {}
    let totalTime = 0
    const gamePlayTime: { [gameId: string]: number } = {}
    const gameTypeTime: { [type: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // Initialize monthly data
    for (let month = 0; month < 12; month++) {
      monthlyPlayTime[month] = 0
      monthlyPlayDays[month] = new Set()
    }

    // Iterate through each day of the year
    const currentDate = new Date(yearStart)
    while (currentDate <= yearEnd) {
      const month = currentDate.getMonth()

      // Calculate total play time for this day
      let dayTotal = 0
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []
        const gameGenres = store.getState().getValue('metadata.genres') || []
        const gameType =
          gameGenres.length > 0 ? (gameGenres[0] === '' ? '未分类' : gameGenres[0]) : '未分类'

        // Use calculateDailyPlayTime to get accurate play time for this day
        const playTime = calculateDailyPlayTime(currentDate, timers)
        dayTotal += playTime

        if (playTime > 0) {
          // Accumulate play time to game stats
          gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
          // Accumulate play time to game type
          gameTypeTime[gameType] = (gameTypeTime[gameType] || 0) + playTime
        }
      }

      // If this day has any play time, add it to the monthly stats
      if (dayTotal > 0) {
        const dateStr = i18next.format(currentDate, 'niceISO')
        monthlyPlayDays[month].add(dateStr)
        monthlyPlayTime[month] += dayTotal
        totalTime += dayTotal
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Find the month with most play time
    let mostPlayedMonth: MostPlayedMonth | null = null
    for (let month = 0; month < 12; month++) {
      if (mostPlayedMonth === null || monthlyPlayTime[month] > mostPlayedMonth.playTime) {
        mostPlayedMonth = {
          month,
          playTime: monthlyPlayTime[month]
        }
      }
    }

    // Get the most played games
    const mostPlayedGames = Object.entries(gamePlayTime)
      .map(([gameId, playTime]) => ({ gameId, playTime }))
      .filter((item) => item.playTime > 0)
      .sort((a, b) => b.playTime - a.playTime)
      .slice(0, 5)

    // Convert to array format
    const monthlyPlayTimeArray = Object.entries(monthlyPlayTime)
      .map(([month, playTime]) => ({ month: parseInt(month), playTime }))
      .sort((a, b) => a.month - b.month)

    const monthlyPlayDaysArray = Object.entries(monthlyPlayDays)
      .map(([month, days]) => ({ month: parseInt(month), days: days.size }))
      .sort((a, b) => a.month - b.month)

    // Game Type Distribution
    const gameTypeDistribution = Object.entries(gameTypeTime)
      .map(([type, playTime]) => ({ type, playTime }))
      .sort((a, b) => b.playTime - a.playTime)

    return {
      totalTime,
      monthlyPlayTime: monthlyPlayTimeArray,
      monthlyPlayDays: monthlyPlayDaysArray,
      mostPlayedMonth,
      mostPlayedGames,
      gameTypeDistribution
    }
  } catch (error) {
    console.error('Error in getYearlyPlayData:', error)
    return {
      totalTime: 0,
      monthlyPlayTime: [],
      monthlyPlayDays: [],
      mostPlayedMonth: null,
      mostPlayedGames: [],
      gameTypeDistribution: []
    }
  }
}

/**
 * Get tour time distribution (by hour)
 */
export function getPlayTimeDistribution(): { hour: number; value: number }[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const distribution: { [hour: number]: number } = {}

    // Initialize hourly data
    for (let hour = 0; hour < 24; hour++) {
      distribution[hour] = 0
    }

    // Iterate through each game
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers')

      // Traverse each play record
      for (const timer of timers) {
        const start = new Date(timer.start)
        const end = new Date(timer.end)

        let current = new Date(start)
        while (current < end) {
          const hour = current.getHours()

          // Calculate the current hour's play time (in milliseconds)
          const hourEnd = new Date(current)
          hourEnd.setMinutes(59, 59, 999)

          const segmentEnd = end < hourEnd ? end : hourEnd
          const segmentTime = segmentEnd.getTime() - current.getTime()

          distribution[hour] += segmentTime

          // Move to next hour
          current = new Date(hourEnd.getTime() + 1)
        }
      }
    }

    return Object.entries(distribution).map(([hour, time]) => ({
      hour: parseInt(hour),
      value: time / 3600000 // Convert to hours
    }))
  } catch (error) {
    console.error('Error in getPlayTimeDistribution:', error)
    return []
  }
}

/**
 * Get game ratings ranking
 */
export function getGameScoreRanking(): { gameId: string; score: number }[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const gamesWithScores: { gameId: string; score: number }[] = []

    // Iterate through each game
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const score = store.getState().getValue('record.score')

      if (score > 0) {
        // Includes only rated games
        gamesWithScores.push({ gameId, score })
      }
    }

    // Sort by rating
    return gamesWithScores.sort((a, b) => b.score - a.score)
  } catch (error) {
    console.error('Error in getGameScoreRanking:', error)
    return []
  }
}

/**
 * Get recently added games
 */
export function getRecentlyAddedGames(count = 5): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    const gamesWithAddDate = gameIds.map((gameId) => {
      const store = getGameStore(gameId)
      const addDate = store.getState().getValue('record.addDate')
      return { gameId, addDate }
    })

    // 按添加日期排序
    return gamesWithAddDate
      .filter((game) => game.addDate) // Filtering out games with no date added
      .sort((a, b) => new Date(b.addDate).getTime() - new Date(a.addDate).getTime())
      .slice(0, count)
      .map((game) => game.gameId)
  } catch (error) {
    console.error('Error in getRecentlyAddedGames:', error)
    return []
  }
}

/**
 * Get recently run games
 */
export function getRecentlyPlayedGames(count = 5): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    const gamesWithLastRunDate = gameIds.map((gameId) => {
      const store = getGameStore(gameId)
      const lastRunDate = store.getState().getValue('record.lastRunDate')
      return { gameId, lastRunDate }
    })

    // Sort by last run date
    return gamesWithLastRunDate
      .filter((game) => game.lastRunDate) // Filter out games with no run date
      .sort((a, b) => new Date(b.lastRunDate).getTime() - new Date(a.lastRunDate).getTime())
      .slice(0, count)
      .map((game) => game.gameId)
  } catch (error) {
    console.error('Error in getRecentlyPlayedGames:', error)
    return []
  }
}

/**
 * Get the number of game memories.
 */
export function getGameMemoryCount(gameId: string): number {
  try {
    const store = getGameStore(gameId)
    const memoryList = store.getState().getValue('memory.memoryList')
    return memoryList ? Object.keys(memoryList).length : 0
  } catch (error) {
    console.error(`Error in getGameMemoryCount for ${gameId}:`, error)
    return 0
  }
}

/**
 * Getting the number of game saves
 */
export function getGameSaveCount(gameId: string): number {
  try {
    const store = getGameStore(gameId)
    const saveList = store.getState().getValue('save.saveList')
    return saveList ? Object.keys(saveList).length : 0
  } catch (error) {
    console.error(`Error in getGameSaveCount for ${gameId}:`, error)
    return 0
  }
}

/**
 * Get recently added memory games
 */
export function getRecentMemoryGames(
  count = 5
): { gameId: string; memoryId: string; date: string }[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const allMemories: { gameId: string; memoryId: string; date: string }[] = []

    // Iterate through each game
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const memoryList = store.getState().getValue('memory.memoryList')

      if (memoryList) {
        Object.entries(memoryList).forEach(([memoryId, memory]) => {
          allMemories.push({
            gameId,
            memoryId,
            date: memory.date
          })
        })
      }
    }

    // Sort by date
    return allMemories
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count)
  } catch (error) {
    console.error('Error in getRecentMemoryGames:', error)
    return []
  }
}

// 按评分区间获取游戏
export function getGamesByScoreRange(minScore: number, maxScore: number): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const gamesInRange: string[] = []

    // Iterate through each game
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const score = store.getState().getValue('record.score')

      // Filtering games with a specified rating range
      if (score >= minScore && score <= maxScore) {
        gamesInRange.push(gameId)
      }
    }

    // Sort by rating in descending order
    return gamesInRange.sort((a, b) => {
      const scoreA = getGameStore(a).getState().getValue('record.score')
      const scoreB = getGameStore(b).getState().getValue('record.score')
      return scoreB - scoreA
    })
  } catch (error) {
    console.error(`Error in getGamesByScoreRange:`, error)
    return []
  }
}

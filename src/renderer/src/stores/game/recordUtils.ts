import type { DailyPlayTime, Timer } from '@appTypes/models'
import { getGameStore, useGameRegistry } from '~/stores/game'
import {
  formatLocalDateKey,
  getBusinessDateKey,
  getBusinessDayStartFromKey,
  getConfiguredDayBoundaryHour,
  getDateKeysInRange,
  parseLocalDate,
  splitTimeRangeByBusinessDay
} from './dayBoundaryUtils'

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

export { formatLocalDateKey, parseLocalDate }

// Maximum allowed play time per day (24 hours in milliseconds)
const MAX_DAILY_PLAYTIME = 24 * 60 * 60 * 1000

export interface CalculateDailyPlayTimeOptions {
  dateKey: string
  timers: Timer[]
  dayBoundaryHour?: number
  dailyPlayTimes?: DailyPlayTime[]
}

/**
 * Normalize date-only untracked play time records into a canonical list.
 *
 * The database should already contain records in this canonical form. Write
 * paths must call this before persisting `record.dailyPlayTimes`; read-side
 * callers use it defensively.
 *
 * Date-only play time is user-entered or imported play time that is known only
 * at the day level. It must not be converted into fake timer intervals because
 * that would pollute hour-of-day distribution and timeline charts.
 *
 * Normalization rules:
 * - Invalid date keys are dropped. Date keys must be strict local `YYYY-MM-DD`.
 * - Non-finite, zero, or negative play time values are dropped.
 * - Multiple records for the same date are merged by summing `playTime`.
 * - The returned list is sorted by date ascending for stable storage and diffs.
 *
 * @param dailyPlayTimes Raw date-only play time records.
 * @returns Canonical daily play time records.
 */
export function normalizeDailyPlayTimes(
  dailyPlayTimes: DailyPlayTime[] | undefined
): DailyPlayTime[] {
  if (!Array.isArray(dailyPlayTimes)) return []

  const byDate = new Map<string, number>()

  for (const item of dailyPlayTimes || []) {
    const date = typeof item?.date === 'string' ? item.date : ''
    if (isNaN(parseLocalDate(date).getTime())) continue

    const playTime = Number(item.playTime)
    if (!Number.isFinite(playTime) || playTime <= 0) continue

    byDate.set(date, (byDate.get(date) || 0) + playTime)
  }

  return Array.from(byDate.entries())
    .map(([date, playTime]) => ({ date, playTime }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate total date-only untracked play time.
 *
 * Persisted records are expected to be canonical already; normalization here is
 * defensive so calculations remain stable for legacy, synced, or otherwise
 * malformed data.
 *
 * @param dailyPlayTimes Raw date-only play time records.
 * @returns Total valid date-only play time in milliseconds.
 */
export function calculateTotalDailyPlayTime(dailyPlayTimes: DailyPlayTime[] | undefined): number {
  return normalizeDailyPlayTimes(dailyPlayTimes).reduce((total, item) => total + item.playTime, 0)
}

/**
 * Return canonical date-only untracked play time records inside an optional date range.
 *
 * Persisted records are expected to be canonical already, normalization here is defensive.
 *
 * The optional range filter is inclusive and compares normalized `YYYY-MM-DD`
 * strings lexicographically, which is safe for this date format.
 *
 * @param dailyPlayTimes Raw date-only play time records.
 * @param startDate Optional inclusive lower date key (`YYYY-MM-DD`).
 * @param endDate Optional inclusive upper date key (`YYYY-MM-DD`).
 * @returns Canonical date-only records in ascending date order.
 */
export function getDailyPlayTimesInRange(
  dailyPlayTimes: DailyPlayTime[] | undefined,
  startDate?: string,
  endDate?: string
): DailyPlayTime[] {
  return normalizeDailyPlayTimes(dailyPlayTimes).filter((item) => {
    if (startDate && item.date < startDate) return false
    if (endDate && item.date > endDate) return false
    return true
  })
}

/**
 * Caps daily play time to 24 hours maximum
 *
 * @TODO Fix the root cause: Multiple game instances running simultaneously
 * can cause calculated play time to exceed 24 hours per day
 *
 * Note:
 * Business-day boundary configuration only changes how intervals are split into days.
 * A single business day still has an absolute upper bound of 24 hours.
 *
 * @param playTime - Raw play time in milliseconds
 * @param date - Date for logging (optional)
 * @returns Play time capped at 24 hours
 */
export function capDailyPlayTime(playTime: number, date?: Date | string): number {
  if (playTime <= MAX_DAILY_PLAYTIME) {
    return playTime
  }

  const hours = (playTime / 3600000).toFixed(2)
  const dateStr = date ? ` on ${date}` : ''

  console.warn(`Play time exceeds 24 hours${dateStr}: ${hours} hours, capped to 24 hours`)

  return MAX_DAILY_PLAYTIME
}

/**
 * Calculate the game time for one business-date key.
 *
 * The options object keeps timer data, boundary configuration, and date-only
 * records named at call sites. That is intentional because `dayBoundaryHour` and
 * `dailyPlayTimes` are both optional context, and positional arguments make
 * those values easy to swap as this calculation grows.
 *
 * @param options Date key, precise timers, optional day-boundary hour, and optional date-only records.
 * @returns Total play time for the requested business date in milliseconds.
 */
export function calculateDailyPlayTime({
  dateKey,
  timers,
  dayBoundaryHour = getConfiguredDayBoundaryHour(),
  dailyPlayTimes
}: CalculateDailyPlayTimeOptions): number {
  try {
    const targetDate = getBusinessDayStartFromKey(dateKey, dayBoundaryHour)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(dayBoundaryHour, 0, 0, 0)

    let totalPlayTime = 0

    // Iterate over all timer records
    for (const timer of timers) {
      const start = new Date(timer.start)
      const end = new Date(timer.end)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid timer record:', timer)
        continue
      }

      // If the timer record does not overlap with the target date, it is skipped
      if (end <= targetDate || start >= nextDay) continue

      // Calculate overlap time
      const overlapStart = start < targetDate ? targetDate : start
      const overlapEnd = end > nextDay ? nextDay : end

      // Increase total play time
      totalPlayTime += overlapEnd.getTime() - overlapStart.getTime()
    }

    const dailyPlayTime = getDailyPlayTimesInRange(dailyPlayTimes, dateKey, dateKey).reduce(
      (total, item) => total + item.playTime,
      0
    )

    return totalPlayTime + dailyPlayTime
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
  weeklyPlayTimers: { [gameId: string]: { start: string; end: string }[] }
  mostPlayedDay: WeeklyMostPlayedDay | null
  mostPlayedGames: { gameId: string; playTime: number }[]
} {
  try {
    const dayBoundaryHour = getConfiguredDayBoundaryHour()
    const selectedBusinessDateKey = getBusinessDateKey(date, dayBoundaryHour)
    const selectedBusinessDate = parseLocalDate(selectedBusinessDateKey)

    // Calculate week start (Monday) using business-date labels.
    const weekStartDate = new Date(selectedBusinessDate)
    weekStartDate.setDate(
      selectedBusinessDate.getDate() -
        selectedBusinessDate.getDay() +
        (selectedBusinessDate.getDay() === 0 ? -6 : 1)
    )

    const weekStartDateKey = formatLocalDateKey(weekStartDate)
    const weekStart = getBusinessDayStartFromKey(weekStartDateKey, dayBoundaryHour)
    const weekEndExclusive = new Date(weekStart)
    weekEndExclusive.setDate(weekEndExclusive.getDate() + 7)
    weekEndExclusive.setHours(dayBoundaryHour, 0, 0, 0)

    // Generate an array of date labels for this week.
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 6)
    const dates = getDateKeysInRange(weekStartDateKey, formatLocalDateKey(weekEndDate))

    // Calculate daily play time
    const dailyPlayTime: { [date: string]: number } = {}
    let totalTime = 0
    let mostPlayedDay: WeeklyMostPlayedDay | null = null
    const gamePlayTime: { [gameId: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // Every day
    for (const dateStr of dates) {
      let dayTotal = 0

      // Iterate through all the games
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []
        const dailyPlayTimes = store.getState().getValue('record.dailyPlayTimes') || []

        // Calculate the playtime of the game on this day
        const playTime = calculateDailyPlayTime({
          dateKey: dateStr,
          timers,
          dayBoundaryHour,
          dailyPlayTimes
        })
        dayTotal += playTime

        // Accumulate the total play time for each game
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
      }

      dayTotal = capDailyPlayTime(dayTotal, dateStr)

      dailyPlayTime[dateStr] = dayTotal
      totalTime += dayTotal

      // Update the day you play the most games
      if (dayTotal > (mostPlayedDay?.playTime ?? 0)) {
        mostPlayedDay = {
          date: dateStr,
          playTime: dayTotal
        }
      }
    }

    const playedGames = Object.entries(gamePlayTime)
      .map(([gameId, playTime]) => ({ gameId, playTime }))
      .filter((item) => item.playTime > 0)
      .sort((a, b) => b.playTime - a.playTime)

    const weeklyPlayTimers: { [gameId: string]: { start: string; end: string }[] } = {}
    for (const { gameId } of playedGames) {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers') || []
      const filteredTimers: { start: string; end: string }[] = []

      // Get timers in the range
      for (const timer of timers) {
        const start = new Date(timer.start)
        const end = new Date(timer.end)
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('Invalid timer record:', timer)
          continue
        }

        // If the timer record does not overlap with the target range, it is skipped
        const startMs = start.getTime()
        const endMs = end.getTime()
        const weekStartMs = weekStart.getTime()
        const weekEndMs = weekEndExclusive.getTime()

        if (endMs <= weekStartMs || startMs >= weekEndMs) continue

        const clippedStart = new Date(Math.max(startMs, weekStartMs))
        const clippedEnd = new Date(Math.min(endMs, weekEndMs))

        filteredTimers.push({
          start: clippedStart.toISOString(),
          end: clippedEnd.toISOString()
        })
      }

      if (filteredTimers.length > 0) {
        filteredTimers.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        weeklyPlayTimers[gameId] = filteredTimers
      }
    }

    // Get the most played games (in order of time)
    const mostPlayedGames = playedGames

    return {
      dates,
      totalTime,
      dailyPlayTime,
      weeklyPlayTimers,
      mostPlayedDay,
      mostPlayedGames
    }
  } catch (error) {
    console.error('Error in getWeeklyPlayData:', error)
    return {
      dates: [],
      totalTime: 0,
      dailyPlayTime: {},
      weeklyPlayTimers: {},
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
  dailyWeekNumber: { [date: string]: number } // The key is the same as the above variable
  mostPlayedDay: MonthlyMostPlayedDay | null
  weeklyPlayTime: { week: number; playTime: number }[]
  mostPlayedGames: { gameId: string; playTime: number }[]
} {
  try {
    const dayBoundaryHour = getConfiguredDayBoundaryHour()
    const selectedBusinessDateKey = getBusinessDateKey(date, dayBoundaryHour)
    const selectedBusinessDate = parseLocalDate(selectedBusinessDateKey)

    // Use business-date labels to determine month boundaries.
    const monthStart = new Date(
      selectedBusinessDate.getFullYear(),
      selectedBusinessDate.getMonth(),
      1
    )
    const monthEnd = new Date(
      selectedBusinessDate.getFullYear(),
      selectedBusinessDate.getMonth() + 1,
      0
    )
    const dates = getDateKeysInRange(formatLocalDateKey(monthStart), formatLocalDateKey(monthEnd))

    // Calculate daily play time
    const dailyPlayTime: { [date: string]: number } = {}
    const dailyWeekNumber: { [date: string]: number } = {}
    const weeklyPlayTime: { [week: number]: number } = {}
    let totalTime = 0
    let mostPlayedDay: MonthlyMostPlayedDay | null = null
    const gamePlayTime: { [gameId: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // Every day
    for (const dateStr of dates) {
      const dayDate = parseLocalDate(dateStr)
      let dayTotal = 0

      // Calculate what week of the month the current date is
      const firstWeek = 1 // set the first day of the week to Monday (0-Sun, 1-Mon, ...)
      const weekOfFirstDay =
        (new Date(dayDate.getFullYear(), dayDate.getMonth(), 1).getDay() - firstWeek + 7) % 7
      const weekOfMonth = Math.ceil((dayDate.getDate() + weekOfFirstDay) / 7)

      // Iterate through all the games
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []
        const dailyPlayTimes = store.getState().getValue('record.dailyPlayTimes') || []

        // Calculate the playtime of the game on this day
        const playTime = calculateDailyPlayTime({
          dateKey: dateStr,
          timers,
          dayBoundaryHour,
          dailyPlayTimes
        })
        dayTotal += playTime

        // Accumulate the total play time for each game
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
      }

      dayTotal = capDailyPlayTime(dayTotal, dateStr)

      dailyPlayTime[dateStr] = dayTotal
      dailyWeekNumber[dateStr] = weekOfMonth
      weeklyPlayTime[weekOfMonth] = (weeklyPlayTime[weekOfMonth] || 0) + dayTotal
      totalTime += dayTotal

      // Update the day when you play the most games
      if (dayTotal > (mostPlayedDay?.playTime ?? 0)) {
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

    // Converting weekly playtime into an array
    const weeklyPlayTimeArray = Object.entries(weeklyPlayTime)
      .map(([week, playTime]) => ({ week: parseInt(week), playTime }))
      .sort((a, b) => a.week - b.week)

    return {
      totalTime,
      dailyPlayTime,
      dailyWeekNumber,
      mostPlayedDay,
      weeklyPlayTime: weeklyPlayTimeArray,
      mostPlayedGames
    }
  } catch (error) {
    console.error('Error in getMonthlyPlayData:', error)
    return {
      totalTime: 0,
      dailyPlayTime: {},
      dailyWeekNumber: {},
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
  gameTypeDistribution: {
    type: string
    detail: { gameId: string; playTime: number }[]
    summary: number
  }[]
} {
  try {
    const dayBoundaryHour = getConfiguredDayBoundaryHour()

    // Year range in business-day timeline: [Jan 1st boundary, next Jan 1st boundary)
    const yearStart = getBusinessDayStartFromKey(`${year}-01-01`, dayBoundaryHour)
    const yearEndExclusive = getBusinessDayStartFromKey(`${year + 1}-01-01`, dayBoundaryHour)
    const yearStartMs = yearStart.getTime()
    const yearEndMs = yearEndExclusive.getTime()

    const monthlyPlayTime: { [month: number]: number } = {}
    const monthlyPlayDays: { [month: number]: Set<string> } = {}
    let totalTime = 0
    let abnormalTimerCount = 0
    const gamePlayTime: { [gameId: string]: number } = {}
    const gameTypeTime: {
      [type: string]: { detail: { gameId: string; playTime: number }[]; summary: number }
    } = {}

    const { gameIds } = useGameRegistry.getState()

    // Initialize monthly data
    for (let month = 0; month < 12; month++) {
      monthlyPlayTime[month] = 0
      monthlyPlayDays[month] = new Set()
    }

    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers') || []
      const dailyPlayTimes = store.getState().getValue('record.dailyPlayTimes') || []
      const gameGenres = store.getState().getValue('metadata.genres') || []

      // gameTypeTime initialization
      const gameType =
        gameGenres.length > 0 ? (gameGenres[0] === '' ? '未分类' : gameGenres[0]) : '未分类'
      gameTypeTime[gameType] = gameTypeTime[gameType] || {
        detail: [],
        summary: 0
      }
      gameTypeTime[gameType].detail.push({ gameId, playTime: 0 })

      for (const timer of timers) {
        const start = new Date(timer.start).getTime()
        const end = new Date(timer.end).getTime()
        if (isNaN(start) || isNaN(end)) continue
        if (end <= yearStartMs || start >= yearEndMs) continue

        const overlapStartY = Math.max(start, yearStartMs)
        const overlapEndY = Math.min(end, yearEndMs)
        if (overlapEndY <= overlapStartY) continue

        // gamePlayTime accumulation
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + (overlapEndY - overlapStartY)

        // gameTypeTime accumulation
        gameTypeTime[gameType].detail[gameTypeTime[gameType].detail.length - 1].playTime +=
          overlapEndY - overlapStartY
        gameTypeTime[gameType].summary += overlapEndY - overlapStartY

        const daySegments = splitTimeRangeByBusinessDay(overlapStartY, overlapEndY, dayBoundaryHour)
        if (daySegments.length === 0) {
          abnormalTimerCount += 1
        }
        for (const segment of daySegments) {
          const playTime = segment.endMs - segment.startMs
          const month = parseLocalDate(segment.key).getMonth()

          monthlyPlayDays[month].add(segment.key)
          monthlyPlayTime[month] += playTime
          totalTime += playTime
        }
      }

      for (const item of normalizeDailyPlayTimes(dailyPlayTimes)) {
        if (item.date < `${year}-01-01` || item.date >= `${year + 1}-01-01`) continue

        const month = parseLocalDate(item.date).getMonth()

        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + item.playTime
        gameTypeTime[gameType].detail[gameTypeTime[gameType].detail.length - 1].playTime +=
          item.playTime
        gameTypeTime[gameType].summary += item.playTime
        monthlyPlayDays[month].add(item.date)
        monthlyPlayTime[month] += item.playTime
        totalTime += item.playTime
      }

      if (gameTypeTime[gameType].detail[gameTypeTime[gameType].detail.length - 1].playTime === 0) {
        gameTypeTime[gameType].detail.pop()
      }
    }

    if (abnormalTimerCount > 0) {
      console.warn(
        `[getYearlyPlayData] Dropped ${abnormalTimerCount} abnormal timer range(s) while aggregating year ${year}.`
      )
    }

    // Find the month with most play time
    let mostPlayedMonth: MostPlayedMonth | null = null
    for (let month = 0; month < 12; month++) {
      if (monthlyPlayTime[month] > (mostPlayedMonth?.playTime ?? 0)) {
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

    // Convert to array format
    const monthlyPlayTimeArray = Object.entries(monthlyPlayTime)
      .map(([month, playTime]) => ({ month: parseInt(month), playTime }))
      .sort((a, b) => a.month - b.month)

    const monthlyPlayDaysArray = Object.entries(monthlyPlayDays)
      .map(([month, days]) => ({ month: parseInt(month), days: days.size }))
      .sort((a, b) => a.month - b.month)

    // Game Type Distribution
    const gameTypeDistribution = Object.entries(gameTypeTime)
      .map(([type, { detail, summary }]) => ({
        type,
        detail: detail.slice().sort((a, b) => b.playTime - a.playTime),
        summary
      }))
      .sort((a, b) => b.summary - a.summary)

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
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('Invalid timer record:', timer)
          continue
        }

        let current = new Date(start)

        while (current < end) {
          const hour = current.getHours()

          // Calculate the current hour's play time (in milliseconds)
          const hourEnd = new Date(current)
          hourEnd.setMinutes(59, 59, 999)

          const segmentEnd = end < hourEnd ? end : hourEnd
          const segmentTime = segmentEnd.getTime() - current.getTime()

          distribution[hour] += segmentTime

          // Move to the next hour boundary
          // Using setHours() instead of manual time calculation to properly handle
          // daylight saving time (DST) transitions where hours may be skipped or repeated
          current = new Date(current)
          current.setHours(current.getHours() + 1, 0, 0, 0)
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

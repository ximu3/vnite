import { getGameStore, useGameRegistry } from '~/stores/game'
import type { gameDoc } from '@appTypes/database'

interface WeeklyMostPlayedDay {
  date: string
  playTime: number
  weekday: string
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
 * 计算特定日期的游戏时间（毫秒）
 */
export function calculateDailyPlayTime(date: Date, timers: gameDoc['record']['timers']): number {
  try {
    // 确保我们只处理日期部分，不关心时间
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const nextDay = new Date(targetDate)
    nextDay.setDate(targetDate.getDate() + 1)

    let totalPlayTime = 0

    // 遍历所有计时器记录
    for (const timer of timers) {
      const start = new Date(timer.start)
      const end = new Date(timer.end)

      // 如果计时器记录与目标日期没有重叠，则跳过
      if (end < targetDate || start >= nextDay) continue

      // 计算重叠时间
      const overlapStart = start < targetDate ? targetDate : start
      const overlapEnd = end > nextDay ? nextDay : end

      // 增加总播放时间
      totalPlayTime += overlapEnd.getTime() - overlapStart.getTime()
    }

    return totalPlayTime
  } catch (error) {
    console.error('Error in calculateDailyPlayTime:', error)
    return 0
  }
}

/**
 * 获取指定周的游玩数据
 */
export function getWeeklyPlayData(date = new Date()): {
  dates: string[]
  totalTime: number
  dailyPlayTime: { [date: string]: number }
  mostPlayedDay: WeeklyMostPlayedDay | null
  mostPlayedGames: { gameId: string; playTime: number }[]
} {
  try {
    // 计算一周的开始(周一)和结束(周日)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // 生成这周的日期数组
    const dates: string[] = []
    const current = new Date(weekStart)
    while (current <= weekEnd) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    // 计算每天的游玩时间
    const dailyPlayTime: { [date: string]: number } = {}
    let totalTime = 0
    let mostPlayedDay: WeeklyMostPlayedDay | null = null
    const gamePlayTime: { [gameId: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // 遍历每一天
    for (const dateStr of dates) {
      const dayDate = new Date(dateStr)
      let dayTotal = 0

      // 遍历所有游戏
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []

        // 计算该游戏在这一天的游玩时间
        const playTime = calculateDailyPlayTime(dayDate, timers)
        dayTotal += playTime

        // 累加每个游戏的总游玩时间
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
      }

      dailyPlayTime[dateStr] = dayTotal
      totalTime += dayTotal

      // 更新玩游戏最多的那一天
      if (mostPlayedDay === null || dayTotal > mostPlayedDay.playTime) {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        mostPlayedDay = {
          date: dateStr,
          playTime: dayTotal,
          weekday: weekdays[dayDate.getDay()]
        }
      }
    }

    // 获取玩得最多的游戏(按照时间排序)
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
 * 获取指定月的游玩数据
 */
export function getMonthlyPlayData(date = new Date()): {
  totalTime: number
  dailyPlayTime: { [date: string]: number }
  mostPlayedDay: MonthlyMostPlayedDay | null
  weeklyPlayTime: { week: number; playTime: number }[]
  mostPlayedGames: { gameId: string; playTime: number }[]
} {
  try {
    // 计算月初和月末
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

    // 生成这个月的日期数组
    const dates: string[] = []
    const current = new Date(monthStart)
    while (current <= monthEnd) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    // 计算每天的游玩时间
    const dailyPlayTime: { [date: string]: number } = {}
    const weeklyPlayTime: { [week: number]: number } = {}
    let totalTime = 0
    let mostPlayedDay: MonthlyMostPlayedDay | null = null
    const gamePlayTime: { [gameId: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // 遍历每一天
    for (const dateStr of dates) {
      const dayDate = new Date(dateStr)
      let dayTotal = 0

      // 计算当前日期是该月第几周
      const weekOfMonth = Math.ceil(
        (dayDate.getDate() + new Date(dayDate.getFullYear(), dayDate.getMonth(), 1).getDay()) / 7
      )

      // 遍历所有游戏
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const timers = store.getState().getValue('record.timers') || []

        // 计算该游戏在这一天的游玩时间
        const playTime = calculateDailyPlayTime(dayDate, timers)
        dayTotal += playTime

        // 累加每个游戏的总游玩时间
        gamePlayTime[gameId] = (gamePlayTime[gameId] || 0) + playTime
      }

      dailyPlayTime[dateStr] = dayTotal
      weeklyPlayTime[weekOfMonth] = (weeklyPlayTime[weekOfMonth] || 0) + dayTotal
      totalTime += dayTotal

      // 更新玩游戏最多的那一天
      if (mostPlayedDay === null || dayTotal > mostPlayedDay.playTime) {
        mostPlayedDay = {
          date: dateStr,
          playTime: dayTotal
        }
      }
    }

    // 获取玩得最多的游戏
    const mostPlayedGames = Object.entries(gamePlayTime)
      .map(([gameId, playTime]) => ({ gameId, playTime }))
      .filter((item) => item.playTime > 0)
      .sort((a, b) => b.playTime - a.playTime)
      .slice(0, 3)

    // 将周游玩时间转化为数组
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
 * 获取指定年的游玩数据
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
    // 计算年初和年末
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

    const monthlyPlayTime: { [month: number]: number } = {}
    const monthlyPlayDays: { [month: number]: Set<string> } = {}
    let totalTime = 0
    const gamePlayTime: { [gameId: string]: number } = {}
    const gameTypeTime: { [type: string]: number } = {}

    const { gameIds } = useGameRegistry.getState()

    // 初始化月份数据
    for (let month = 0; month < 12; month++) {
      monthlyPlayTime[month] = 0
      monthlyPlayDays[month] = new Set()
    }

    // 遍历每个游戏
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers') || []
      // 获取游戏类型，使用数组的第一个元素或默认值
      const gameGenres = store.getState().getValue('metadata.genres') || []
      const gameType =
        gameGenres.length > 0 ? (gameGenres[0] === '' ? '未分类' : gameGenres[0]) : '未分类'

      let gamePlayTimeTotal = 0

      // 遍历每个游玩记录
      for (const timer of timers) {
        const start = new Date(timer.start)
        const end = new Date(timer.end)

        // 只处理今年的记录
        if (start.getFullYear() !== year && end.getFullYear() !== year) continue

        // 确保开始时间不早于年初
        const effectiveStart = start < yearStart ? yearStart : start
        // 确保结束时间不晚于年末
        const effectiveEnd = end > yearEnd ? yearEnd : end

        // 计算时间差，毫秒
        const playTime = effectiveEnd.getTime() - effectiveStart.getTime()

        if (playTime <= 0) continue

        gamePlayTimeTotal += playTime

        // 记录游玩天数
        const dayStr = effectiveStart.toISOString().split('T')[0]
        const month = effectiveStart.getMonth()
        monthlyPlayDays[month].add(dayStr)
        monthlyPlayTime[month] += playTime
      }

      // 累加到游戏的总时间
      gamePlayTime[gameId] = gamePlayTimeTotal

      // 累加到游戏类型的时间
      if (gamePlayTimeTotal > 0) {
        gameTypeTime[gameType] = (gameTypeTime[gameType] || 0) + gamePlayTimeTotal
      }

      totalTime += gamePlayTimeTotal
    }

    // 找出玩游戏最多的月份
    let mostPlayedMonth: MostPlayedMonth | null = null
    for (let month = 0; month < 12; month++) {
      if (mostPlayedMonth === null || monthlyPlayTime[month] > mostPlayedMonth.playTime) {
        mostPlayedMonth = {
          month,
          playTime: monthlyPlayTime[month]
        }
      }
    }

    // 获取玩得最多的游戏
    const mostPlayedGames = Object.entries(gamePlayTime)
      .map(([gameId, playTime]) => ({ gameId, playTime }))
      .filter((item) => item.playTime > 0)
      .sort((a, b) => b.playTime - a.playTime)
      .slice(0, 5)

    // 转换为数组格式
    const monthlyPlayTimeArray = Object.entries(monthlyPlayTime)
      .map(([month, playTime]) => ({ month: parseInt(month), playTime }))
      .sort((a, b) => a.month - b.month)

    const monthlyPlayDaysArray = Object.entries(monthlyPlayDays)
      .map(([month, days]) => ({ month: parseInt(month), days: days.size }))
      .sort((a, b) => a.month - b.month)

    // 游戏类型分布
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
 * 获取游玩时间分布（按小时）
 */
export function getPlayTimeDistribution(): { hour: number; value: number }[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const distribution: { [hour: number]: number } = {}

    // 初始化每小时的数据
    for (let hour = 0; hour < 24; hour++) {
      distribution[hour] = 0
    }

    // 遍历每个游戏
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers') || []

      // 遍历每个游玩记录
      for (const timer of timers) {
        const start = new Date(timer.start)
        const end = new Date(timer.end)

        let current = new Date(start)
        while (current < end) {
          const hour = current.getHours()

          // 计算当前小时的游玩时间（毫秒）
          const hourEnd = new Date(current)
          hourEnd.setMinutes(59, 59, 999)

          const segmentEnd = end < hourEnd ? end : hourEnd
          const segmentTime = segmentEnd.getTime() - current.getTime()

          distribution[hour] += segmentTime

          // 移到下一小时
          current = new Date(hourEnd.getTime() + 1)
        }
      }
    }

    return Object.entries(distribution).map(([hour, time]) => ({
      hour: parseInt(hour),
      value: time / 3600000 // 转换为小时
    }))
  } catch (error) {
    console.error('Error in getPlayTimeDistribution:', error)
    return []
  }
}

/**
 * 获取游戏评分排行
 */
export function getGameScoreRanking(): { gameId: string; score: number }[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const gamesWithScores: { gameId: string; score: number }[] = []

    // 遍历每个游戏
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const score = store.getState().getValue('record.score') || 0

      if (score > 0) {
        // 只包含有评分的游戏
        gamesWithScores.push({ gameId, score })
      }
    }

    // 按评分排序
    return gamesWithScores.sort((a, b) => b.score - a.score)
  } catch (error) {
    console.error('Error in getGameScoreRanking:', error)
    return []
  }
}

/**
 * 获取最近添加的游戏
 */
export function getRecentlyAddedGames(count = 5): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    const gamesWithAddDate = gameIds.map((gameId) => {
      const store = getGameStore(gameId)
      const addDate = store.getState().getValue('record.addDate') || ''
      return { gameId, addDate }
    })

    // 按添加日期排序
    return gamesWithAddDate
      .filter((game) => game.addDate) // 过滤掉没有添加日期的游戏
      .sort((a, b) => new Date(b.addDate).getTime() - new Date(a.addDate).getTime())
      .slice(0, count)
      .map((game) => game.gameId)
  } catch (error) {
    console.error('Error in getRecentlyAddedGames:', error)
    return []
  }
}

/**
 * 获取最近运行的游戏
 */
export function getRecentlyPlayedGames(count = 5): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    const gamesWithLastRunDate = gameIds.map((gameId) => {
      const store = getGameStore(gameId)
      const lastRunDate = store.getState().getValue('record.lastRunDate') || ''
      return { gameId, lastRunDate }
    })

    // 按最后运行日期排序
    return gamesWithLastRunDate
      .filter((game) => game.lastRunDate) // 过滤掉没有运行日期的游戏
      .sort((a, b) => new Date(b.lastRunDate).getTime() - new Date(a.lastRunDate).getTime())
      .slice(0, count)
      .map((game) => game.gameId)
  } catch (error) {
    console.error('Error in getRecentlyPlayedGames:', error)
    return []
  }
}

/**
 * 获取游戏记忆(memory)数量
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
 * 获取游戏存档(save)数量
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
 * 获取最近添加记忆的游戏
 */
export function getRecentMemoryGames(
  count = 5
): { gameId: string; memoryId: string; date: string }[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const allMemories: { gameId: string; memoryId: string; date: string }[] = []

    // 遍历每个游戏
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

    // 按日期排序
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

    // 遍历每个游戏
    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const score = store.getState().getValue('record.score') || 0

      // 筛选指定评分范围的游戏
      if (score >= minScore && score <= maxScore) {
        gamesInRange.push(gameId)
      }
    }

    // 按评分降序排序
    return gamesInRange.sort((a, b) => {
      const scoreA = getGameStore(a).getState().getValue('record.score') || 0
      const scoreB = getGameStore(b).getState().getValue('record.score') || 0
      return scoreB - scoreA
    })
  } catch (error) {
    console.error(`Error in getGamesByScoreRange:`, error)
    return []
  }
}

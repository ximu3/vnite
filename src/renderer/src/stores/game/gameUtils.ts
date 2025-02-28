import { calculateDailyPlayTime } from '@appUtils'
import { getGameStore } from './gameStoreFactory'
import { useGameRegistry } from './gameRegistry'
import type { MaxPlayTimeDay, gameDoc } from '@appTypes/database'
import type { Paths } from 'type-fest'

// 搜索函数
export function searchGames(query: string): string[] {
  if (!query.trim()) return useGameRegistry.getState().gameIds

  const lowercaseQuery = query.toLowerCase()
  const { gameIds, gameMetaIndex } = useGameRegistry.getState()

  // 先通过轻量索引过滤
  const potentialMatches = gameIds.filter((id) => {
    const meta = gameMetaIndex[id]
    return (
      meta &&
      (meta.name.toLowerCase().includes(lowercaseQuery) ||
        (meta.genre && meta.genre.toLowerCase().includes(lowercaseQuery)))
    )
  })

  // 如果需要更深入搜索
  if (potentialMatches.length === 0) {
    return gameIds.filter((id) => {
      const store = getGameStore(id)
      const game = store.getState().data
      if (!game?.metadata) return false

      // 进行更深入的搜索
      try {
        return Object.values(game.metadata).some(
          (value) => value && value.toString().toLowerCase().includes(lowercaseQuery)
        )
      } catch (_e) {
        return false
      }
    })
  }

  return potentialMatches
}

// 排序函数
export function sortGames<Path extends Paths<gameDoc, { bracketNotation: true }>>(
  by: Path,
  order: 'asc' | 'desc' = 'asc'
): string[] {
  const gameIds = useGameRegistry.getState().gameIds

  return [...gameIds].sort((a, b) => {
    const storeA = getGameStore(a)
    const storeB = getGameStore(b)

    const valueA = storeA.getState().getValue(by)
    const valueB = storeB.getState().getValue(by)

    if (valueA == null && valueB == null) return 0
    if (valueA == null) return order === 'asc' ? 1 : -1
    if (valueB == null) return order === 'asc' ? -1 : 1
    if (valueA === valueB) return 0

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
      // 如果类型不明确，尝试转换为字符串进行比较
      const strA = String(valueA)
      const strB = String(valueB)
      return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
    }
  })
}

// 过滤函数
export function filterGames(
  criteria: Partial<Record<Paths<gameDoc, { bracketNotation: true }>, string[]>>
): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const results: string[] = []

    for (const gameId of gameIds) {
      try {
        const store = getGameStore(gameId)
        const game = store.getState().data
        if (!game) continue

        let matchesAllCriteria = true

        for (const [path, values] of Object.entries(criteria)) {
          try {
            if (!Array.isArray(values) || values.length === 0) continue

            const metadataValue = store.getState().getValue(path as any)

            if (
              path === 'metadata.releaseDate' &&
              Array.isArray(values) &&
              values.length === 2 &&
              metadataValue
            ) {
              // 日期范围过滤逻辑
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
              // 其他类型过滤逻辑
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
    console.error('Fatal error in filterGames:', error)
    return []
  }
}

// 获取某个键的所有唯一值
export function getAllValuesInKey<Path extends Paths<gameDoc, { bracketNotation: true }>>(
  path: Path
): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const values = new Set<string>()

    for (const gameId of gameIds) {
      try {
        const store = getGameStore(gameId)

        let value: any
        try {
          value = store.getState().getValue(path)
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
}

// 获取游戏时间
export function getGameplayTime(gameId: string): number {
  try {
    const store = getGameStore(gameId)
    const record = store.getState().getValue('record')
    if (!record) return 0

    return record.playTime || 0
  } catch (error) {
    console.error(`Error in getGameplayTime for ${gameId}:`, error)
    return 0
  }
}

// 格式化游戏时间
export function getGameplayTimeFormatted(gameId: string): string {
  try {
    const playTime = getGameplayTime(gameId)

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
}

// 获取游戏时间按日期范围
export function getGamePlayTimeByDateRange(
  gameId: string,
  startDate: string,
  endDate: string
): { [date: string]: number } {
  try {
    const store = getGameStore(gameId)
    const game = store.getState().data

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
}

// 获取游戏玩过的天数
export function getGamePlayDays(gameId: string): number {
  try {
    const store = getGameStore(gameId)
    const game = store.getState().data

    if (!game?.record?.timers || game.record.timers.length === 0) {
      return 0
    }

    const playDays = new Set<string>()

    game.record.timers.forEach((timer) => {
      // 转换为用户本地时区的时间
      const start = new Date(timer.start)
      const end = new Date(timer.end)

      // 获取本地时区的日期字符串
      const startDay = start.toLocaleDateString()
      const endDay = end.toLocaleDateString()

      if (startDay === endDay) {
        playDays.add(startDay)
      } else {
        const current = new Date(start)
        // 设置为当天的开始时间（本地时区）
        current.setHours(0, 0, 0, 0)

        while (current <= end) {
          playDays.add(current.toLocaleDateString())
          current.setDate(current.getDate() + 1)
        }
      }
    })

    return playDays.size
  } catch (error) {
    console.error(`Error in getGamePlayDays for ${gameId}:`, error)
    return 0
  }
}

// 获取游戏最大游玩时间的日期
export function getGameMaxPlayTimeDay(gameId: string): MaxPlayTimeDay | null {
  try {
    const store = getGameStore(gameId)
    const game = store.getState().data

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
  } catch (error) {
    console.error(`Error in getGameMaxPlayTimeDay for ${gameId}:`, error)
    return null
  }
}

// 获取游戏记录
export function getGameRecord(gameId: string): gameDoc['record'] {
  try {
    const store = getGameStore(gameId)
    return (
      store.getState().getValue('record') || {
        addDate: '',
        lastRunDate: '',
        score: 0,
        playTime: 0,
        playStatus: 'unplayed',
        timers: []
      }
    )
  } catch (error) {
    console.error(`Error in getGameRecord for ${gameId}:`, error)
    return {
      addDate: '',
      lastRunDate: '',
      score: 0,
      playTime: 0,
      playStatus: 'unplayed',
      timers: []
    }
  }
}

// 获取游戏开始和结束日期
export function getGameStartAndEndDate(gameId: string): { start: string; end: string } {
  try {
    const store = getGameStore(gameId)
    const game = store.getState().data

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
  } catch (error) {
    console.error(`Error in getGameStartAndEndDate for ${gameId}:`, error)
    return { start: '', end: '' }
  }
}

// 根据游玩时间排序游戏
export function getSortedGameIds(order: 'asc' | 'desc' = 'asc'): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    return [...gameIds].sort((a, b) => {
      const timeA = getGameplayTime(a)
      const timeB = getGameplayTime(b)

      if (timeA < timeB) {
        return order === 'asc' ? -1 : 1
      } else if (timeA > timeB) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  } catch (error) {
    console.error(`Error in getSortedGameIds:`, error)
    return useGameRegistry.getState().gameIds
  }
}

// 获取最大序号的游戏ID
export function getMaxOrdinalGameId(): string | null {
  try {
    const { gameIds } = useGameRegistry.getState()
    let maxPlayedTimes = 0
    let maxOrdinalGameId: string | null = null

    for (const gameId of gameIds) {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers')

      if (timers && timers.length > maxPlayedTimes) {
        maxPlayedTimes = timers.length
        maxOrdinalGameId = gameId
      }
    }

    return maxOrdinalGameId
  } catch (error) {
    console.error(`Error in getMaxOrdinalGameId:`, error)
    return null
  }
}

// 获取年度游玩天数
export function getPlayedDaysYearly(): { [date: string]: number } {
  try {
    const { gameIds } = useGameRegistry.getState()
    const currentDate = new Date()
    const lastYearDate = new Date(currentDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)

    const result: { [date: string]: number } = {}
    const current = new Date(currentDate)
    const datesArray: { date: string; playTime: number }[] = []

    while (current.getTime() >= lastYearDate.getTime()) {
      const dateStr = current.toLocaleDateString('en-CA')
      let playTime = 0

      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const game = store.getState().data

        if (game?.record?.timers) {
          playTime += calculateDailyPlayTime(current, game.record.timers)
        }
      }

      datesArray.push({ date: dateStr, playTime })
      current.setDate(current.getDate() - 1)
    }

    datesArray.sort((a, b) => a.date.localeCompare(b.date))
    datesArray.forEach(({ date, playTime }) => {
      result[date] = playTime
    })

    return result
  } catch (error) {
    console.error(`Error in getPlayedDaysYearly:`, error)
    return {}
  }
}

// 获取年度总游戏时间
export function getTotalplayTimeYearly(): number {
  try {
    const { gameIds } = useGameRegistry.getState()
    const currentDate = new Date()
    const lastYearDate = new Date(currentDate)
    lastYearDate.setFullYear(lastYearDate.getFullYear() - 1)

    let totalPlayTime = 0
    const current = new Date(currentDate)

    while (current.getTime() >= lastYearDate.getTime()) {
      for (const gameId of gameIds) {
        const store = getGameStore(gameId)
        const game = store.getState().data

        if (game?.record?.timers) {
          totalPlayTime += calculateDailyPlayTime(current, game.record.timers)
        }
      }
      current.setDate(current.getDate() - 1)
    }

    return totalPlayTime
  } catch (error) {
    console.error(`Error in getTotalplayTimeYearly:`, error)
    return 0
  }
}

// 获取总游戏时间
export function getTotalplayTime(): number {
  try {
    const { gameIds } = useGameRegistry.getState()

    return gameIds.reduce((total, gameId) => {
      return total + getGameplayTime(gameId)
    }, 0)
  } catch (error) {
    console.error(`Error in getTotalplayTime:`, error)
    return 0
  }
}

// 获取总游玩次数
export function getTotalPlayedTimes(): number {
  try {
    const { gameIds } = useGameRegistry.getState()

    return gameIds.reduce((total, gameId) => {
      const store = getGameStore(gameId)
      const timers = store.getState().getValue('record.timers')
      return total + (timers?.length || 0)
    }, 0)
  } catch (error) {
    console.error(`Error in getTotalPlayedTimes:`, error)
    return 0
  }
}

// 获取总游玩天数
export function getTotalPlayedDays(): number {
  try {
    const { gameIds } = useGameRegistry.getState()

    return gameIds.reduce((total, gameId) => {
      return total + getGamePlayDays(gameId)
    }, 0)
  } catch (error) {
    console.error(`Error in getTotalPlayedDays:`, error)
    return 0
  }
}

// 根据游玩次数排序游戏
export function getSortedGameByPlayedTimes(order: 'asc' | 'desc' = 'asc'): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    return [...gameIds].sort((a, b) => {
      const storeA = getGameStore(a)
      const storeB = getGameStore(b)

      const timesA = storeA.getState().getValue('record.timers')?.length || 0
      const timesB = storeB.getState().getValue('record.timers')?.length || 0

      if (timesA < timesB) {
        return order === 'asc' ? -1 : 1
      } else if (timesA > timesB) {
        return order === 'asc' ? 1 : -1
      }
      return 0
    })
  } catch (error) {
    console.error(`Error in getSortedGameByPlayedTimes:`, error)
    return useGameRegistry.getState().gameIds
  }
}

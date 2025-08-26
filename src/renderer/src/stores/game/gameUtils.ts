import type { MaxPlayTimeDay, gameDoc } from '@appTypes/models'
import { calculateDailyPlayTime } from '@appUtils'
import i18next from 'i18next'
import type { Paths } from 'type-fest'
import { parseLocalDate } from '~/stores/game/recordUtils'
import { useConfigStore } from '../config'
import { useGameRegistry } from './gameRegistry'
import { getGameStore } from './gameStoreFactory'

// Search Functions
export function searchGames(query: string): string[] {
  if (!query.trim()) return useGameRegistry.getState().gameIds

  const lowercaseQuery = query.toLowerCase()
  const { gameIds, gameMetaIndex } = useGameRegistry.getState()

  // Filter by light indexing first
  const potentialMatches = gameIds.filter((id) => {
    const meta = gameMetaIndex[id]
    return (
      meta &&
      (meta.name.toLowerCase().includes(lowercaseQuery) ||
        (meta.genre && meta.genre.toLowerCase().includes(lowercaseQuery)))
    )
  })

  // If need to search deeper
  if (potentialMatches.length === 0) {
    return gameIds.filter((id) => {
      const store = getGameStore(id)
      const game = store.getState().data
      if (!game?.metadata) return false

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

export function randomGame(): string | null {
  const { gameIds } = useGameRegistry.getState()
  if (gameIds.length === 0) return null
  const randomIndex = Math.floor(Math.random() * gameIds.length)
  return gameIds[randomIndex]
}

// sorting function
export function sortGames<Path extends Paths<gameDoc, { bracketNotation: true }>>(
  by: Path,
  order: 'asc' | 'desc' = 'asc',
  gameIds?: string[]
): string[] {
  if (!gameIds) gameIds = useGameRegistry.getState().gameIds
  const language = useConfigStore.getState().getConfigValue('general.language')

  return [...gameIds].sort((a, b) => {
    const storeA = getGameStore(a)
    const storeB = getGameStore(b)

    const valueA = storeA.getState().getValue(by)
    const valueB = storeB.getState().getValue(by)

    if (valueA == null && valueB == null) return 0
    if (valueA == null) return order === 'asc' ? 1 : -1
    if (valueB == null) return order === 'asc' ? -1 : 1
    if (valueA === valueB) return 0

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      if (by === 'metadata.name') {
        return order === 'asc'
          ? valueA.localeCompare(valueB, language || undefined)
          : valueB.localeCompare(valueA, language || undefined)
      } else {
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
      }
    } else if (typeof valueA === 'number' && typeof valueB === 'number') {
      return order === 'asc' ? valueA - valueB : valueB - valueA
    } else {
      // If the type is not clear, try to convert to a string for comparison
      const strA = String(valueA)
      const strB = String(valueB)
      return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
    }
  })
}

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

            // Handling paths in metadata.extra.xxx format
            if (path.startsWith('metadata.extra.')) {
              const extraKey = path.substring('metadata.extra.'.length)
              const extraArray = store.getState().getValue('metadata.extra')

              if (!extraArray || !Array.isArray(extraArray)) {
                matchesAllCriteria = false
                break
              }

              // Find the item in the array that matches the key
              const matchingItem = extraArray.find((item) => item.key === extraKey)

              // If no matching item is found, or the value doesn't match, the criteria isn't met
              if (!matchingItem || !Array.isArray(matchingItem.value)) {
                matchesAllCriteria = false
                break
              }

              // Check if any value matches the criteria
              const matches = matchingItem.value.some(
                (item) =>
                  item != null &&
                  values.some((value) =>
                    item.toString().toLowerCase().includes(value.toLowerCase())
                  )
              )

              if (!matches) {
                matchesAllCriteria = false
                break
              }

              // Finished processing the extra field, continue to the next condition
              continue
            }

            // Get value at the specified path
            const metadataValue = store.getState().getValue(path as any)

            if (
              path === 'metadata.releaseDate' &&
              Array.isArray(values) &&
              values.length === 2 &&
              metadataValue
            ) {
              // Date range filtering logic
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
              // Other types of filtering logic
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

// Get all unique values for a key
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

    return Array.from(values).filter((item) => item != '')
  } catch (error) {
    console.error('Fatal error in getAllValuesInKey:', error)
    return []
  }
}

/**
 * Get all extra information key names from all games
 * @returns {string[]} Array of all extra information key names
 */
export function getAllExtraKeys(): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const keys = new Set<string>()

    for (const gameId of gameIds) {
      try {
        const store = getGameStore(gameId)
        let extraArray: Array<{ key: string; value: string[] }> | undefined

        try {
          // Get the extra information array
          extraArray = store.getState().getValue('metadata.extra')
        } catch (error) {
          console.error(`Error getting extra info for game ${gameId}:`, error)
          continue
        }

        if (extraArray && Array.isArray(extraArray)) {
          try {
            // Iterate through the array and extract the key from each object
            extraArray.forEach((item) => {
              if (item && item.key) {
                keys.add(item.key)
              }
            })
          } catch (error) {
            console.error(`Error processing extra keys for ${gameId}:`, error)
          }
        }
      } catch (error) {
        console.error(`Error processing game ${gameId}:`, error)
        continue
      }
    }

    return Array.from(keys)
  } catch (error) {
    console.error('Fatal error in getAllExtraKeys:', error)
    return []
  }
}

/**
 * Get all possible values for a specific extra information key
 * @param {string} key Extra information key name
 * @returns {string[]} Array of all distinct values under the specified key
 */
export function getAllExtraValuesForKey(key: string): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()
    const values = new Set<string>()

    for (const gameId of gameIds) {
      try {
        const store = getGameStore(gameId)
        let extraArray: Array<{ key: string; value: string[] }> | undefined

        try {
          // Get the extra information array
          extraArray = store.getState().getValue('metadata.extra')

          if (extraArray && Array.isArray(extraArray)) {
            // Find the item matching the key
            const matchingItem = extraArray.find((item) => item.key === key)

            // If a matching item is found and a value array exists, add each value to the result set
            if (matchingItem && Array.isArray(matchingItem.value)) {
              matchingItem.value.forEach((item) => {
                if (item != null) {
                  values.add(item)
                }
              })
            }
          }
        } catch (_error) {
          // This game may not have this extra information key, silently ignore
          continue
        }
      } catch (error) {
        console.error(`Error processing game ${gameId}:`, error)
        continue
      }
    }

    return Array.from(values).filter((item) => item != '')
  } catch (error) {
    console.error(`Fatal error getting all extra values for key '${key}':`, error)
    return []
  }
}

// Get Game Time
export function getGamePlayTime(gameId: string): number {
  try {
    const store = getGameStore(gameId)
    const record = store.getState().getValue('record')
    if (!record) return 0

    return record.playTime || 0
  } catch (error) {
    console.error(`Error in getGamePlayTime for ${gameId}:`, error)
    return 0
  }
}

// Get game time by date range
export function getGamePlayTimeByDateRange(
  gameId: string,
  startDate: string,
  endDate: string
): { [date: string]: number } {
  try {
    const store = getGameStore(gameId)
    const timers = store.getState().getValue('record.timers')

    if (!timers || timers.length === 0) {
      return {}
    }

    try {
      // const start = new Date(startDate)
      const start = parseLocalDate(startDate)
      // const end = new Date(endDate)
      const end = parseLocalDate(endDate)

      // Date of validation
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error(`Invalid date range: ${startDate} to ${endDate}`)
        return {}
      }

      const result: { [date: string]: number } = {}
      const current = new Date(start)

      while (current <= end) {
        try {
          const dateStr = i18next.format(current, 'niceISO')
          result[dateStr] = calculateDailyPlayTime(current, timers)
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

// Get the dates the game has been played (stored in Set)
export function getGamePlayedDates(gameId: string): Set<string> {
  const playDays = new Set<string>()

  try {
    const store = getGameStore(gameId)
    const timers = store.getState().getValue('record.timers')

    if (!timers || timers.length === 0) {
      return playDays
    }

    timers.forEach((timer) => {
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
  } catch (error) {
    console.error(`Error in getGamePlayedDates for ${gameId}:`, error)
  }

  return playDays
}

// Get the number of days the game has been played
export function getGamePlayDays(gameId: string): number {
  return getGamePlayedDates(gameId).size
}

// Get the date of the game's maximum play time
export function getGameMaxPlayTimeDay(gameId: string): MaxPlayTimeDay | null {
  try {
    const store = getGameStore(gameId)
    const timers = store.getState().getValue('record.timers')

    if (!timers || timers.length === 0) {
      return null
    }

    const allDates = new Set<string>()
    timers.forEach((timer) => {
      const start = new Date(timer.start)
      const end = new Date(timer.end)
      const current = new Date(start)

      while (current <= end) {
        allDates.add(i18next.format(current, 'niceISO'))
        current.setDate(current.getDate() + 1)
      }
    })

    let maxDate = ''
    let maxTime = 0

    allDates.forEach((dateStr) => {
      const currentDate = new Date(dateStr)
      const playTime = calculateDailyPlayTime(currentDate, timers)

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

// Getting Game Records
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

// Get game start and end dates
export function getGameStartAndEndDate(gameId: string): { start: string; end: string } {
  try {
    const store = getGameStore(gameId)
    const timers = store.getState().getValue('record.timers')

    if (!timers || timers.length === 0) {
      return { start: '', end: '' }
    }

    const formatDate = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startTimestamps = timers.map((t) => Date.parse(t.start)).filter((ts) => !isNaN(ts))
    const endTimestamps = timers.map((t) => Date.parse(t.end)).filter((ts) => !isNaN(ts))

    if (endTimestamps.length === 0 || startTimestamps.length === 0) {
      return { start: '', end: '' }
    }

    const start = new Date(Math.min(...startTimestamps))
    const end = new Date(Math.max(...endTimestamps))

    return {
      start: formatDate(start),
      end: formatDate(end)
    }
  } catch (error) {
    console.error(`Error in getGameStartAndEndDate for ${gameId}:`, error)
    return { start: '', end: '' }
  }
}

// Sort games by playtime
export function getSortedGameIds(order: 'asc' | 'desc' = 'asc'): string[] {
  try {
    const { gameIds } = useGameRegistry.getState()

    return [...gameIds].sort((a, b) => {
      const timeA = getGamePlayTime(a)
      const timeB = getGamePlayTime(b)

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

// Get annual play days
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
        const timers = store.getState().getValue('record.timers')

        if (timers) {
          playTime += calculateDailyPlayTime(current, timers)
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

// Get total annual playtime
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
        const timers = store.getState().getValue('record.timers')

        if (timers) {
          totalPlayTime += calculateDailyPlayTime(current, timers)
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

// Get Total Playtime
export function getTotalplayTime(): number {
  try {
    const { gameIds } = useGameRegistry.getState()

    return gameIds.reduce((total, gameId) => {
      return total + getGamePlayTime(gameId)
    }, 0)
  } catch (error) {
    console.error(`Error in getTotalplayTime:`, error)
    return 0
  }
}

// Get Total Play
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

// Get Total Days of Play
export function getTotalPlayedDays(): number {
  try {
    const { gameIds } = useGameRegistry.getState()
    const allDates = new Set<string>()

    for (const gameId of gameIds) {
      for (const date of getGamePlayedDates(gameId)) {
        allDates.add(date)
      }
    }

    return allDates.size
  } catch (error) {
    console.error(`Error in getTotalPlayedDays:`, error)
    return 0
  }
}

// Sort games by number of plays
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

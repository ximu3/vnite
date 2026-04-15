import type { DailyPlayTime, Timer } from '@appTypes/models'
import i18next from 'i18next'
import { normalizeDailyPlayTimes, parseLocalDate } from '~/stores/game/recordUtils'

export interface PlayTimeClipboardData {
  timers: Timer[]
  dailyPlayTimes: DailyPlayTime[]
}

function validateClipboardTimer(value: unknown): { valid: boolean; message?: string } {
  if (typeof value !== 'object' || value === null) return { valid: false, message: 'Not an object' }

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)

  if (keys.length !== 2) return { valid: false, message: 'Number of keys is not 2' }
  if (!keys.includes('start') || !keys.includes('end'))
    return { valid: false, message: 'Missing start or end key' }
  if (typeof obj.start !== 'string' || typeof obj.end !== 'string')
    return { valid: false, message: 'Values must be strings' }
  if (isNaN(Date.parse(obj.start)) || isNaN(Date.parse(obj.end)))
    return { valid: false, message: 'Invalid date' }

  return { valid: true }
}

function validateClipboardDailyPlayTime(value: unknown): { valid: boolean; message?: string } {
  if (typeof value !== 'object' || value === null) return { valid: false, message: 'Not an object' }

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)

  if (keys.length !== 2) return { valid: false, message: 'Number of keys is not 2' }
  if (!keys.includes('date') || !keys.includes('playTime'))
    return { valid: false, message: 'Missing date or playTime key' }
  if (typeof obj.date !== 'string') return { valid: false, message: 'Date must be a string' }
  if (isNaN(parseLocalDate(obj.date).getTime())) return { valid: false, message: 'Invalid date' }
  if (typeof obj.playTime !== 'number' || !Number.isFinite(obj.playTime) || obj.playTime <= 0)
    return { valid: false, message: 'Play time must be a positive number' }

  return { valid: true }
}

export function parsePlayTimeClipboardData(data: string): PlayTimeClipboardData {
  const parsed = JSON.parse(data)

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Not an object')
  }

  const keys = Object.keys(parsed)
  if (keys.length !== 2 || !keys.includes('timers') || !keys.includes('dailyPlayTimes')) {
    throw new Error('Object must contain only timers and dailyPlayTimes')
  }

  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.timers)) {
    throw new Error('timers must be an array')
  }
  if (!Array.isArray(obj.dailyPlayTimes)) {
    throw new Error('dailyPlayTimes must be an array')
  }

  for (const [index, item] of obj.timers.entries()) {
    const validation = validateClipboardTimer(item)
    if (!validation.valid) {
      throw new Error(`Invalid timer item at index ${index}: ${validation.message}`)
    }
  }

  for (const [index, item] of obj.dailyPlayTimes.entries()) {
    const validation = validateClipboardDailyPlayTime(item)
    if (!validation.valid) {
      throw new Error(`Invalid dailyPlayTimes item at index ${index}: ${validation.message}`)
    }
  }

  return {
    timers: obj.timers as Timer[],
    dailyPlayTimes: normalizeDailyPlayTimes(obj.dailyPlayTimes as DailyPlayTime[])
  }
}

export function validateAndSortTimers(timers: Timer[]): {
  message: string | null
  sortedTimers: Timer[]
} {
  const timersWithIndex = timers.map((timer, originalIndex) => ({
    timer,
    originalIndex,
    timerStamped: { start: new Date(timer.start).getTime(), end: new Date(timer.end).getTime() }
  }))

  for (const { originalIndex, timerStamped } of timersWithIndex) {
    if (isNaN(timerStamped.start) || isNaN(timerStamped.end)) {
      return {
        message: i18next.t('game:detail.timersEditor.error.invalidTime', {
          index: originalIndex + 1
        }),
        sortedTimers: timers
      }
    }

    if (timerStamped.end < timerStamped.start) {
      return {
        message: i18next.t('game:detail.timersEditor.error.endBeforeStart', {
          index: originalIndex + 1
        }),
        sortedTimers: timers
      }
    }
  }

  const sortedWithIndex = [...timersWithIndex].sort(
    (a, b) => a.timerStamped.start - b.timerStamped.start
  )

  for (let i = 1; i < sortedWithIndex.length; i++) {
    const prevEnd = sortedWithIndex[i - 1].timerStamped.end
    const currStart = sortedWithIndex[i].timerStamped.start

    if (prevEnd > currStart) {
      return {
        message: i18next.t('game:detail.timersEditor.error.overlapMessage', {
          first: sortedWithIndex[i - 1].originalIndex + 1,
          second: sortedWithIndex[i].originalIndex + 1
        }),
        sortedTimers: sortedWithIndex.map((item) => item.timer)
      }
    }
  }

  return {
    message: null,
    sortedTimers: sortedWithIndex.map((item) => item.timer)
  }
}

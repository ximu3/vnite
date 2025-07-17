import { get } from 'lodash'
import { v4 } from 'uuid'
import type { Timer } from '@appTypes/models'

export function getValueByPath(obj: any, path: string): any {
  if (path === '#all') {
    return obj
  }

  const pathArray = path
    .replace(/$$(\d+)$$/g, '.$1')
    .split('.')
    .filter(Boolean)

  return get(obj, pathArray)
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

export function setValueByPath(obj: any, path: string, value: any): void {
  if (path === '#all') {
    obj = value
    return
  }

  const pathArray = path
    .replace(/$$(\d+)$$/g, '.$1')
    .split('.')
    .filter(Boolean)

  let current = obj

  // Iterate through the path, except for the last
  for (let i = 0; i < pathArray.length - 1; i++) {
    const key = pathArray[i]

    // If the current node does not exist or is null, create a new object
    if (current === undefined || current === null) {
      current = {}
    }

    // If the key does not exist, create a new object
    if (!(key in current)) {
      current[key] = {}
    }

    current = current[key]
  }

  // Set the value of the last path
  const lastKey = pathArray[pathArray.length - 1]
  if (current === undefined || current === null) {
    current = {}
  }
  current[lastKey] = value
}

export function generateUUID(): string {
  return v4()
}

export const calculateDailyPlayTime = (date: Date, timer: Timer[]): number => {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  if (!timer || timer.length === 0) {
    return 0
  }

  return timer.reduce((totalPlayTime, timerItem) => {
    const timerStart = new Date(timerItem.start)
    const timerEnd = new Date(timerItem.end)

    if (timerStart <= dayEnd && timerEnd >= dayStart) {
      const overlapStart = Math.max(dayStart.getTime(), timerStart.getTime())
      const overlapEnd = Math.min(dayEnd.getTime(), timerEnd.getTime())
      return totalPlayTime + (overlapEnd - overlapStart)
    }

    return totalPlayTime
  }, 0)
}

import path from 'path'
import fse from 'fs-extra'
import log from 'electron-log/main'
import { v4 as uuidv4 } from 'uuid'
import { GameDBManager, ConfigDBManager } from '~/core/database'
import { getDirSize } from '~/utils/common'
import { ipcManager } from '~/core/ipc'
import { STORAGE_SIZE_NOT_CALCULATED } from '@appTypes/models/game'

// Current active task ID - if this changes during execution, task should stop
let currentTaskId: string | null = null

/**
 * Check if a batch calculation task is currently running
 */
export function isBatchStorageSizeCalculationRunning(): boolean {
  return currentTaskId !== null
}

/**
 * Cancel the current batch storage size calculation
 */
export function cancelBatchStorageSizeCalculation(): void {
  currentTaskId = null
}

/**
 * Calculate the storage size of a single game
 * @param gameId Game ID
 * @returns Storage size in bytes, returns STORAGE_SIZE_NOT_CALCULATED if failed
 */
export async function calculateStorageSize(gameId: string): Promise<number> {
  try {
    const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')
    const markPath = await GameDBManager.getGameLocalValue(gameId, 'utils.markPath')

    let targetPath = markPath || ''
    if (!targetPath && gamePath) {
      targetPath = path.dirname(gamePath)
    }

    if (!targetPath) {
      log.warn(`[StorageSize] No valid path found for game ${gameId}`)
      return STORAGE_SIZE_NOT_CALCULATED
    }

    const exists = await fse.pathExists(targetPath)
    if (!exists) {
      log.warn(`[StorageSize] Path does not exist for game ${gameId}: ${targetPath}`)
      return STORAGE_SIZE_NOT_CALCULATED
    }

    const size = await getDirSize(targetPath)

    await GameDBManager.setGameValue(gameId, 'record.storageSize', size)

    log.info(`[StorageSize] Calculated storage size for game ${gameId}: ${size} bytes`)
    return size
  } catch (error) {
    log.error(`[StorageSize] Failed to calculate storage size for game ${gameId}:`, error)
    return STORAGE_SIZE_NOT_CALCULATED
  }
}

/**
 * Calculate storage size during game addition (used by adder)
 * @param dirPath Directory path to calculate
 * @returns Storage size in bytes, returns STORAGE_SIZE_NOT_CALCULATED if failed
 */
export async function calculateStorageSizeForPath(dirPath: string): Promise<number> {
  try {
    if (!dirPath) {
      return STORAGE_SIZE_NOT_CALCULATED
    }

    const exists = await fse.pathExists(dirPath)
    if (!exists) {
      log.warn(`[StorageSize] Path does not exist: ${dirPath}`)
      return STORAGE_SIZE_NOT_CALCULATED
    }

    const size = await getDirSize(dirPath)
    return size
  } catch (error) {
    log.error(`[StorageSize] Failed to calculate storage size for path ${dirPath}:`, error)
    return STORAGE_SIZE_NOT_CALCULATED
  }
}

/**
 * Check if auto-calculate storage size is enabled
 * @returns true if auto-calculate is enabled
 */
export async function isAutoCalculateStorageSizeEnabled(): Promise<boolean> {
  try {
    return await ConfigDBManager.getConfigValue('metadata.autoCalculateStorageSize')
  } catch (error) {
    log.error('[StorageSize] Failed to get auto-calculate setting:', error)
    return false // Default to false
  }
}

export interface BatchStorageSizeResult {
  taskId: string
  wasCancelled: boolean
  total: number
  successful: number
  failed: number
  results: Array<{
    gameId: string
    gameName: string
    size: number
    status: 'success' | 'error'
    error?: string
  }>
}

export interface BatchStorageSizeProgress {
  taskId: string
  gameId: string
  gameName: string
  current: number
  total: number
  status: 'processing' | 'success' | 'error'
  size?: number
  error?: string
}

/**
 * Batch calculate storage size for multiple games
 * Uses task ID for robust task management and supports cancellation
 * @param gameIds Array of game IDs to calculate storage size for
 * @returns Result of the batch operation
 */
export async function batchCalculateStorageSize(
  gameIds: string[]
): Promise<BatchStorageSizeResult> {
  // Prevent concurrent batch calculations
  if (currentTaskId !== null) {
    throw new Error('Batch storage size calculation already in progress')
  }

  // Generate new task ID for this batch
  const taskId = uuidv4()
  currentTaskId = taskId

  const results: BatchStorageSizeResult['results'] = []
  let successful = 0
  let failed = 0

  for (let i = 0; i < gameIds.length; i++) {
    // Check if this task is still the active one (cancelled if taskId changed or null)
    if (currentTaskId !== taskId) {
      return {
        taskId,
        wasCancelled: true,
        total: gameIds.length,
        successful,
        failed,
        results
      }
    }

    const gameId = gameIds[i]
    const gameDoc = await GameDBManager.getGame(gameId)
    const gameName = gameDoc?.metadata?.name || gameId

    // Send progress event with taskId for client to verify
    const progress: BatchStorageSizeProgress = {
      taskId,
      gameId,
      gameName,
      current: i + 1,
      total: gameIds.length,
      status: 'processing'
    }
    ipcManager.send('game:batch-calculate-storage-size-progress', progress)

    try {
      const size = await calculateStorageSize(gameId)

      // Check again after async operation
      if (currentTaskId !== taskId) {
        return { taskId, wasCancelled: true, total: gameIds.length, successful, failed, results }
      }

      if (size >= 0) {
        results.push({ gameId, gameName, size, status: 'success' })
        successful++
      } else {
        results.push({
          gameId,
          gameName,
          size: STORAGE_SIZE_NOT_CALCULATED,
          status: 'error',
          error: 'Path not found'
        })
        failed++
      }
    } catch (error) {
      if (currentTaskId !== taskId) {
        return { taskId, wasCancelled: true, total: gameIds.length, successful, failed, results }
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({
        gameId,
        gameName,
        size: STORAGE_SIZE_NOT_CALCULATED,
        status: 'error',
        error: errorMessage
      })
      failed++
    }

    // Send result event
    const lastResult = results[results.length - 1]
    const resultProgress: BatchStorageSizeProgress = {
      taskId,
      gameId,
      gameName,
      current: i + 1,
      total: gameIds.length,
      status: lastResult.status,
      size: lastResult.size,
      error: lastResult.error
    }
    ipcManager.send('game:batch-calculate-storage-size-progress', resultProgress)
  }

  // Clear task ID when done
  currentTaskId = null

  return { taskId, wasCancelled: false, total: gameIds.length, successful, failed, results }
}

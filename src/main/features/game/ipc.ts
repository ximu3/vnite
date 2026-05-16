import type { GameMediaType } from '@appTypes/models'
import sharp from 'sharp'
import { GameDBManager } from '~/core/database'
import { ipcManager } from '~/core/ipc'
import {
  addGameMemory,
  batchCalculateStorageSize,
  calculateStorageSize,
  cancelBatchStorageSizeCalculation,
  deleteGameMemory,
  deleteGameSave,
  hideGameFromRecentGames,
  isBatchStorageSizeCalculationRunning,
  recalculateLastRunDate,
  restoreGameSave,
  searchGameSavePaths,
  updateGameMemoryCover
} from './services'

export function setupGameIPC(): void {
  ipcManager.handle(
    'game:set-image',
    async (_, gameId: string, type: GameMediaType, image: string) => {
      return await GameDBManager.setGameImage(gameId, type, image)
    }
  )

  ipcManager.handle('game:search-save-paths', async (_, gameId: string) => {
    return await searchGameSavePaths(gameId)
  })

  ipcManager.handle('game:delete-save', async (_, gameId: string, saveId: string) => {
    await deleteGameSave(gameId, saveId)
  })

  ipcManager.handle(
    'game:restore-save',
    async (_, gameId: string, saveId: string, skipIfTargetNewer?: boolean) => {
      await restoreGameSave(gameId, saveId, skipIfTargetNewer)
    }
  )

  ipcManager.handle('game:delete', async (_, gameId: string) => {
    await GameDBManager.removeGame(gameId)
  })

  ipcManager.handle('game:add-memory', async (_, gameId: string) => {
    return await addGameMemory(gameId)
  })

  ipcManager.handle('game:delete-memory', async (_, gameId: string, memoryId: string) => {
    await deleteGameMemory(gameId, memoryId)
  })

  ipcManager.handle(
    'game:update-memory-cover',
    async (_, gameId: string, memoryId: string, imgPath: string) => {
      await updateGameMemoryCover(gameId, memoryId, imgPath)
    }
  )

  ipcManager.handle('game:get-memory-cover-path', async (_, gameId: string, memoryId: string) => {
    return await GameDBManager.getGameMemoryImage(gameId, memoryId, 'file')
  })

  ipcManager.handle(
    'game:get-memory-masonry-items',
    async (_, gameId: string, memoryIds: string[]) => {
      const entries = await Promise.all(
        memoryIds.map(async (memoryId) => {
          try {
            const imageBuffer = await GameDBManager.getGameMemoryImage(gameId, memoryId, 'buffer')
            if (!imageBuffer) return null

            const metadata = await sharp(imageBuffer).metadata()
            if (!metadata.width || !metadata.height) return null

            return [
              memoryId,
              {
                heightRatio: metadata.height / metadata.width
              }
            ] as const
          } catch {
            return null
          }
        })
      )

      return Object.fromEntries(entries.filter((entry) => entry !== null))
    }
  )

  ipcManager.handle('game:get-media-path', async (_, gameId: string, type: GameMediaType) => {
    return await GameDBManager.getGameImage(gameId, type, 'file')
  })

  ipcManager.handle('game:remove-media', async (_, gameId: string, type: GameMediaType) => {
    return await GameDBManager.removeGameImage(gameId, type)
  })

  ipcManager.handle('game:check-exits-by-path', async (_, gamePath: string) => {
    return await GameDBManager.checkGameExitsByPath(gamePath)
  })

  ipcManager.handle('game:calculate-storage-size', async (_, gameId: string) => {
    return await calculateStorageSize(gameId)
  })

  ipcManager.handle('game:batch-calculate-storage-size', async (_, gameIds: string[]) => {
    return await batchCalculateStorageSize(gameIds)
  })

  ipcManager.handle('game:cancel-batch-storage-size-calculation', async () => {
    cancelBatchStorageSizeCalculation()
  })

  ipcManager.handle('game:is-batch-storage-size-calculation-running', async () => {
    return isBatchStorageSizeCalculationRunning()
  })

  ipcManager.handle('game:recalculate-last-run-date', async (_, gameId: string) => {
    return await recalculateLastRunDate(gameId)
  })

  ipcManager.handle('game:hide-from-recent-games', async (_, gameId: string) => {
    await hideGameFromRecentGames(gameId)
  })
}

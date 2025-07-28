import { generateUUID } from '@appUtils'
import { GameDBManager } from '~/core/database'
import log from 'electron-log/main'
import { eventBus } from '~/core/events'

export async function addGameMemory(gameId: string, img?: Buffer | string): Promise<void> {
  try {
    const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
    const memoryId = generateUUID()
    const date = new Date().toISOString()
    const memory = { _id: memoryId, date, note: '' }
    memoryList[memoryId] = memory
    await GameDBManager.setGameValue(gameId, 'memory.memoryList', memoryList)
    if (img) {
      await GameDBManager.setGameMemoryImage(gameId, memoryId, img)
    }

    // Emit event after adding memory
    eventBus.emit(
      'game:memory-created',
      {
        gameId,
        memoryId
      },
      { source: 'game-memory' }
    )
  } catch (error) {
    log.error('[Game] Error adding memory:', error)
    throw error
  }
}

export async function deleteGameMemory(gameId: string, memoryId: string): Promise<void> {
  try {
    const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
    delete memoryList[memoryId]
    await GameDBManager.setGameValue(gameId, 'memory.memoryList', memoryList)
    await GameDBManager.removeGameMemoryImage(gameId, memoryId)

    // Emit event after deleting memory
    eventBus.emit(
      'game:memory-deleted',
      {
        gameId,
        memoryId
      },
      { source: 'game-memory' }
    )
  } catch (error) {
    log.error('[Game] Error deleting memory:', error)
    throw error
  }
}

export async function updateGameMemoryCover(
  gameId: string,
  memoryId: string,
  imgPath: string
): Promise<void> {
  try {
    await GameDBManager.setGameMemoryImage(gameId, memoryId, imgPath)

    // Emit event after updating memory cover
    eventBus.emit(
      'game:memory-cover-updated',
      {
        gameId,
        memoryId
      },
      { source: 'game-memory' }
    )
  } catch (error) {
    log.error('[Game] Error updating memory cover:', error)
    throw error
  }
}

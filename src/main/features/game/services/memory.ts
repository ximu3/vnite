import log from 'electron-log/main'
import path from 'path'

import type { gameDoc } from '@appTypes/models'
import { generateUUID } from '@appUtils'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { eventBus } from '~/core/events'

export async function addGameMemory(
  gameId: string,
  img?: Buffer | string
): Promise<gameDoc['memory']['memoryList'][string]> {
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

    return memory
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
  imgPath: string,
  options?: { originalImagePath?: string }
): Promise<void> {
  try {
    await GameDBManager.setGameMemoryImage(gameId, memoryId, imgPath)

    if (
      options?.originalImagePath &&
      (await ConfigDBManager.getConfigValue('memory.image.autoFillNoteFromFilename'))
    ) {
      const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
      const memory = memoryList[memoryId]
      const filename = path.parse(options.originalImagePath).name

      if (memory && !memory.note.trim() && filename.trim()) {
        await GameDBManager.setGameMemoryNote(gameId, memoryId, filename)
      }
    }

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

export async function addGameMemoryInlineImage(gameId: string, imgPath: string): Promise<string> {
  try {
    const imageId = generateUUID()
    await GameDBManager.setGameMemoryInlineImage(gameId, imageId, imgPath)
    return `attachment://game/${gameId}/images/memories/inline/${imageId}.webp`
  } catch (error) {
    log.error('[Game] Error adding memory inline image:', error)
    throw error
  }
}

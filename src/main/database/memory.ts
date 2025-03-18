import { generateUUID } from '@appUtils'
import { GameDBManager } from './game'
import log from 'electron-log/main'

export async function addMemory(gameId: string): Promise<void> {
  try {
    const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
    const memoryId = generateUUID()
    const date = new Date().toISOString()
    const memory = { _id: memoryId, date, note: '' }
    memoryList[memoryId] = memory
    await GameDBManager.setGameValue(gameId, 'memory.memoryList', memoryList)
  } catch (error) {
    log.error('Error adding memory:', error)
    throw error
  }
}

export async function deleteMemory(gameId: string, memoryId: string): Promise<void> {
  try {
    const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
    delete memoryList[memoryId]
    await GameDBManager.setGameValue(gameId, 'memory.memoryList', memoryList)
    await GameDBManager.removeGameMemoryImage(gameId, memoryId)
  } catch (error) {
    log.error('Error deleting memory:', error)
    throw error
  }
}

export async function updateMemoryCover(
  gameId: string,
  memoryId: string,
  imgPath: string
): Promise<void> {
  try {
    await GameDBManager.setGameMemoryImage(gameId, memoryId, imgPath)
  } catch (error) {
    log.error('Error updating memory cover:', error)
    throw error
  }
}

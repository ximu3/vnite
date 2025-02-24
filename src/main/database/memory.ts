import { generateUUID } from '~/utils'
import { GameDBManager } from './game'

export async function addMemory(gameId: string): Promise<void> {
  const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
  const memoryId = generateUUID()
  const date = new Date().toISOString()
  const memory = { _id: memoryId, date, note: '' }
  memoryList[memoryId] = memory
  await GameDBManager.setGameValue(gameId, 'memory.memoryList', memoryList)
}

export async function deleteMemory(gameId: string, memoryId: string): Promise<void> {
  const memoryList = await GameDBManager.getGameValue(gameId, 'memory.memoryList')
  delete memoryList[memoryId]
  await GameDBManager.setGameValue(gameId, 'memory.memoryList', memoryList)
  await GameDBManager.removeGameMemoryImage(gameId, memoryId)
}

export async function updateMemoryCover(
  gameId: string,
  memoryId: string,
  imgPath: string
): Promise<void> {
  await GameDBManager.setGameMemoryImage(gameId, memoryId, imgPath)
}

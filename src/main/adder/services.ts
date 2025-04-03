import {
  addGameToDB,
  getBatchGameAdderData,
  addGameToDBWithoutMetadata,
  updateGame
} from './common'
import log from 'electron-log/main.js'

/**
 * Add a game to the database
 * @param dataSource - The data source of the game
 * @param dataSourceId - The ID of the game
 * @param backgroundUrl - The background URL of the game
 * @param playTime - The play time of the game
 */
export async function addGameToDatabase({
  dataSource,
  dataSourceId,
  backgroundUrl,
  playTime,
  dirPath
}: {
  dataSource: string
  dataSourceId: string
  backgroundUrl?: string
  playTime?: number
  dirPath?: string
}): Promise<void> {
  try {
    await addGameToDB({
      dataSource,
      dataSourceId,
      backgroundUrl,
      playTime,
      dirPath
    })
  } catch (error) {
    log.error('Error adding game to database:', error)
    throw error
  }
}

/**
 * Update game metadata
 * @param dbId - The ID of the game in the database
 * @param dataSource - The data source of the game
 * @param dataSourceId - The ID of the game
 * @param backgroundUrl - The background URL of the game
 */
export async function updateGameMetadata({
  dbId,
  dataSource,
  dataSourceId,
  backgroundUrl
}: {
  dbId: string
  dataSource: string
  dataSourceId: string
  backgroundUrl?: string
}): Promise<void> {
  try {
    await updateGame({ dbId, dataSource, dataSourceId, backgroundUrl })
  } catch (error) {
    log.error('Error updating game metadata:', error)
    throw error
  }
}

/**
 * Get batch game adder data from directory
 * @returns The batch game adder data
 */
export async function getBatchGameAdderDataFromDirectory(): Promise<
  { name: string; id: string; status: string }[]
> {
  try {
    return await getBatchGameAdderData()
  } catch (error) {
    log.error('Error getting batch game adder data:', error)
    throw error
  }
}

/**
 * Add a game to the database without metadata
 * @param gamePath - The path of the game
 */
export async function addGameToDatabaseWithoutMetadata(gamePath: string): Promise<void> {
  try {
    await addGameToDBWithoutMetadata(gamePath)
  } catch (error) {
    log.error('Error adding game to database without metadata:', error)
    throw error
  }
}

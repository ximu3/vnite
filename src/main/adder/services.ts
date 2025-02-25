import { addGameToDB, getBatchGameAdderData, addGameToDBWithoutMetadata } from './common'
import log from 'electron-log/main.js'

/**
 * Add a game to the database
 * @param dataSource - The data source of the game
 * @param id - The ID of the game
 * @param dbId - The ID of the game in the database
 * @param screenshotUrl - The URL of the screenshot of the game
 * @param playingTime - The playing time of the game
 */
export async function addGameToDatabase({
  dataSource,
  id,
  preExistingDbId,
  screenshotUrl,
  playTime
}: {
  dataSource: string
  id: string
  preExistingDbId?: string
  screenshotUrl?: string
  playTime?: number
  noWatcherAction?: boolean
}): Promise<void> {
  try {
    await addGameToDB({
      dataSource,
      id,
      preExistingDbId,
      screenshotUrl,
      playTime
    })
  } catch (error) {
    log.error('Error adding game to database:', error)
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

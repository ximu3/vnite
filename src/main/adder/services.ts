import { addGameToDB, getBatchGameAdderData, addGameToDBWithoutMetadata } from './common'
import log from 'electron-log/main.js'

export async function addGameToDatabase({
  dataSource,
  id,
  dbId,
  screenshotUrl,
  playingTime
}: {
  dataSource: string
  id: string
  dbId?: string
  screenshotUrl?: string
  playingTime?: number
}): Promise<void> {
  try {
    await addGameToDB({ dataSource, id, dbId, screenshotUrl, playingTime })
  } catch (error) {
    log.error('Error adding game to database:', error)
    throw error
  }
}

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

export async function addGameToDatabaseWithoutMetadata(gamePath: string): Promise<void> {
  try {
    await addGameToDBWithoutMetadata(gamePath)
  } catch (error) {
    log.error('Error adding game to database without metadata:', error)
    throw error
  }
}

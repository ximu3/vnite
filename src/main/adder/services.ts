import { addGameToDB, getBatchGameAdderData } from './common'
import log from 'electron-log/main.js'

export async function addGameToDatabase(
  dataSource: string,
  id: string,
  dbId: string,
  screenshotUrl?: string
): Promise<void> {
  try {
    await addGameToDB(dataSource, id, dbId, screenshotUrl)
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

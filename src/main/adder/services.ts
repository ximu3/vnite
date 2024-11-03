import { addGameToDB } from './common'
import log from 'electron-log/main.js'

export async function addGameToDatabase(dataSource, id, screenshotUrl): Promise<void> {
  try {
    await addGameToDB(dataSource, id, screenshotUrl)
  } catch (error) {
    log.error('Error adding game to database:', error)
    throw error
  }
}

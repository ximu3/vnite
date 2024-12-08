import { importUserSteamGamesToDatabase } from './common'
import log from 'electron-log/main.js'

/**
 * Import user steam games to the database
 * @param steamId The steam id of the user
 * @returns A promise that resolves when the operation is complete.
 * @throws An error if the operation fails.
 */
export async function importUserSteamGamesToDB(steamId: string): Promise<void> {
  try {
    await importUserSteamGamesToDatabase(steamId)
  } catch (error) {
    log.error('Error adding user steam games to database:', error)
    throw error
  }
}

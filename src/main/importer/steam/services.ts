import { importUserSteamGamesToDatabase } from './common'
import log from 'electron-log/main.js'

export async function importUserSteamGamesToDB(steamId: string): Promise<void> {
  try {
    await importUserSteamGamesToDatabase(steamId)
  } catch (error) {
    log.error('Error adding user steam games to database:', error)
    throw error
  }
}

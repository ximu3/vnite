import { getUserSteamGames, importSelectedSteamGames } from './common'
import { FormattedGameInfo } from './types'
import log from 'electron-log/main.js'

/**
 * Getting information about a user's Steam library
 * @param steamId Steam User ID
 * @returns Steam Game Library Information
 */
export async function getSteamGames(steamId: string): Promise<FormattedGameInfo[]> {
  try {
    return await getUserSteamGames(steamId)
  } catch (error) {
    log.error('Failed to get Steam game library:', error)
    throw error
  }
}

/**
 * Import selected Steam games to the database
 * @param games Selected Steam games
 * @returns Number of games imported
 */
export async function importSteamGames(games: FormattedGameInfo[]): Promise<number> {
  try {
    return await importSelectedSteamGames(games)
  } catch (error) {
    log.error('Failed to import Steam game:', error)
    throw error
  }
}

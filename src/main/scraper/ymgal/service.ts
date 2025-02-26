import {
  searchYMGalGames,
  getYMGalMetadata,
  getYMGalCover,
  getYMGalScreenshots,
  checkYMGalExists
} from './common'
import log from 'electron-log/main.js'
import { GameList, GameMetadata } from '../types'

/**
 * Search for games on YMGal
 * @param gameName The name of the game to search for
 * @returns A list of games
 * @throws An error if the operation fails
 */
export async function searchGamesFromYMGal(gameName: string): Promise<GameList> {
  try {
    const games = await searchYMGalGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

/**
 * Get game metadata from YMGal
 * @param gameId The id of the game on YMGal
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromYMGal(gameId: string): Promise<GameMetadata> {
  try {
    const metadata = await getYMGalMetadata(gameId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

/**
 * Check if a game exists on YMGal
 * @param gameId The id of the game on YMGal
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExistsOnYMGal(gameId: string): Promise<boolean> {
  try {
    const exists = await checkYMGalExists(gameId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

/**
 * Get game screenshots from YMGal
 * @param gameId The id of the game on YMGal
 * @returns A list of screenshots
 */
export async function getGameScreenshotsFromYMGal(gameId: string): Promise<string[]> {
  try {
    const screenshots = await getYMGalScreenshots(gameId)
    return screenshots
  } catch (error) {
    log.error('Error fetching game screenshots:', error)
    throw error
  }
}

/**
 * Get game cover from YMGal
 * @param gameId The id of the game on YMGal
 * @returns A cover image
 */
export async function getGameCoverFromYMGal(gameId: string): Promise<string> {
  try {
    const cover = await getYMGalCover(gameId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

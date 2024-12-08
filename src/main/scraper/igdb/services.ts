// services.ts
import {
  getGameCover,
  getGameScreenshots,
  getIGDBMetadata,
  checkIGDBGameExists,
  searchIGDBGames,
  initIGDB
} from './common'
import { GameList, GameMetadata } from '../types'
import log from 'electron-log/main.js'

/**
 * Search for games on IGDB
 * @param gameName The name of the game to search for
 * @returns A list of games
 * @throws An error if the operation fails
 */
export async function searchGamesFromIGDB(gameName: string): Promise<GameList> {
  try {
    const games = await searchIGDBGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

/**
 * Get game metadata from IGDB
 * @param gameId The id of the game on IGDB
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromIGDB(gameId: string): Promise<GameMetadata> {
  try {
    const metadata = await getIGDBMetadata(gameId)
    return metadata
  } catch (error) {
    log.error('Error fetching game meta', error)
    throw error
  }
}

/**
 * Check if a game exists on IGDB
 * @param gameId The id of the game on IGDB
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExistsOnIGDB(gameId: string): Promise<boolean> {
  try {
    const exists = await checkIGDBGameExists(gameId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

/**
 * Get game screenshots from IGDB
 * @param gameId The id of the game on IGDB
 * @returns A list of screenshots
 * @throws An error if the operation fails
 */
export async function getGameScreenshotsFromIGDB(gameId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(gameId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

/**
 * Get the game cover from IGDB
 * @param gameId The id of the game on IGDB
 * @returns The URL of the game cover
 * @throws An error if the operation fails
 */
export async function getGameCoverFromIGDB(gameId: string): Promise<string> {
  try {
    const cover = await getGameCover(gameId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

/**
 * Initialize the IGDB service
 * @throws An error if the operation fails
 */
export function initIGDBService(): void {
  try {
    initIGDB()
  } catch (error) {
    log.error('Error initializing IGDB service:', error)
    throw error
  }
}

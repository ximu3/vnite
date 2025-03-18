// services.ts
import {
  getGameCover,
  getGameBackgrounds,
  getIGDBMetadata,
  checkIGDBGameExists,
  searchIGDBGames,
  initIGDB,
  getGameCoverByName,
  getGameBackgroundsByName,
  getIGDBMetadataByName
} from './common'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
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
 * @param identifier The identifier of the game
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromIGDB(
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  try {
    const metadata =
      identifier.type === 'id'
        ? await getIGDBMetadata(identifier.value)
        : await getIGDBMetadataByName(identifier.value)
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
 * Get game backgrounds from IGDB
 * @param identifier The identifier of the game
 * @returns A list of backgrounds
 * @throws An error if the operation fails
 */
export async function getGameBackgroundsFromIGDB(identifier: ScraperIdentifier): Promise<string[]> {
  try {
    const images =
      identifier.type === 'id'
        ? await getGameBackgrounds(identifier.value)
        : await getGameBackgroundsByName(identifier.value)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

/**
 * Get the game cover from IGDB
 * @param identifier The identifier of the game
 * @returns The URL of the game cover
 * @throws An error if the operation fails
 */
export async function getGameCoverFromIGDB(identifier: ScraperIdentifier): Promise<string> {
  try {
    const cover =
      identifier.type === 'id'
        ? await getGameCover(identifier.value)
        : await getGameCoverByName(identifier.value)
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

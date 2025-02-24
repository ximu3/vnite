import {
  searchVNDBGames,
  getVNMetadata,
  checkVNExists,
  getGameScreenshots,
  getGameCover,
  getGameScreenshotsByTitle,
  getGameCoverByTitle
} from './common'
import { GameList, GameMetadata } from '@appTypes/utils'
import log from 'electron-log/main.js'

/**
 * Search for games on VNDB
 * @param gameName The name of the game to search for
 * @returns A list of games
 * @throws An error if the operation fails
 */
export async function searchGamesFromVNDB(gameName: string): Promise<GameList> {
  try {
    const games = await searchVNDBGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

/**
 * Get game metadata from VNDB
 * @param vnId The id of the game on VNDB
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromVNDB(vnId: string): Promise<GameMetadata> {
  try {
    const metadata = await getVNMetadata(vnId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

/**
 * Check if a game exists on VNDB
 * @param vnId The id of the game on VNDB
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExistsOnVNDB(vnId: string): Promise<boolean> {
  try {
    const exists = await checkVNExists(vnId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

/**
 * Get game screenshots from VNDB
 * @param vnId The id of the game on VNDB
 * @returns A list of image urls
 * @throws An error if the operation fails
 */
export async function getGameScreenshotsFromVNDB(vnId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(vnId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

/**
 * Get game cover from VNDB
 * @param vnId The id of the game on VNDB
 * @returns The cover image url
 * @throws An error if the operation fails
 */
export async function getGameCoverFromVNDB(vnId: string): Promise<string> {
  try {
    const cover = await getGameCover(vnId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

/**
 * Get game screenshots by title from VNDB
 * @param title The title of the game
 * @returns A list of image urls
 * @throws An error if the operation fails
 */
export async function getGameScreenshotsByTitleFromVNDB(title: string): Promise<string[]> {
  try {
    const images = await getGameScreenshotsByTitle(title)
    return images
  } catch (error) {
    log.error('Error fetching game images by title:', error)
    throw error
  }
}

/**
 * Get game cover by title from VNDB
 * @param title The title of the game
 * @returns The cover image url
 * @throws An error if the operation fails
 */
export async function getGameCoverByTitleFromVNDB(title: string): Promise<string> {
  try {
    const cover = await getGameCoverByTitle(title)
    return cover
  } catch (error) {
    log.error('Error fetching game cover by title:', error)
    throw error
  }
}

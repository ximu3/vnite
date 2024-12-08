import {
  searchBangumiGames,
  getBangumiMetadata,
  getGameScreenshots,
  getGameCover,
  checkGameExists
} from './common'
import { GameList, GameMetadata } from '../types'
import log from 'electron-log/main.js'

/**
 * Search for games on Bangumi
 * @param gameName The name of the game to search for
 * @returns A list of games
 * @throws An error if the operation fails
 */
export async function searchGamesFromBangumi(gameName: string): Promise<GameList> {
  try {
    const games = await searchBangumiGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

/**
 * Get game metadata from Bangumi
 * @param bangumiId The id of the game on Bangumi
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromBangumi(bangumiId: string): Promise<GameMetadata> {
  try {
    const metadata = await getBangumiMetadata(bangumiId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

/**
 * Check if a game exists on Bangumi
 * @param bangumiId The id of the game on Bangumi
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExistsOnBangumi(bangumiId: string): Promise<boolean> {
  try {
    const exists = await checkGameExists(bangumiId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

/**
 * Get game screenshots from Bangumi
 * @param bangumiId The id of the game on Bangumi
 * @returns A list of screenshots
 * @throws An error if the operation fails
 */
export async function getGameScreenshotsFromBangumi(bangumiId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(bangumiId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

/**
 * Get game cover from Bangumi
 * @param bangumiId The id of the game on Bangumi
 * @returns The cover image for the game
 * @throws An error if the operation fails
 */
export async function getGameCoverFromBangumi(bangumiId: string): Promise<string> {
  try {
    const cover = await getGameCover(bangumiId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

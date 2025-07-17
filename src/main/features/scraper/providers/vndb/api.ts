import {
  searchVNDBGames,
  getVNMetadata,
  getVNMetadataByName,
  checkVNExists,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName
} from './common'
import { GameList, GameMetadata } from '@appTypes/utils'
import log from 'electron-log/main.js'
import { ScraperIdentifier } from '@appTypes/utils'

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
 * @param identifier The identifier of the game
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromVNDB(
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  try {
    const metadata =
      identifier.type === 'id'
        ? await getVNMetadata(identifier.value)
        : await getVNMetadataByName(identifier.value)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

/**
 * Check if a game exists on VNDB
 * @param identifier The identifier of the game
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExistsOnVNDB(identifier: ScraperIdentifier): Promise<boolean> {
  try {
    if (identifier.type === 'id') {
      const exists = await checkVNExists(identifier.value)
      return exists
    } else {
      // For name-based search, we can try to get metadata and see if it returns valid results
      const metadata = await getVNMetadataByName(identifier.value)
      return metadata.name !== identifier.value || metadata.description !== ''
    }
  } catch (error) {
    log.error('Error checking if game exists:', error)
    return false
  }
}

/**
 * Get game backgrounds from VNDB
 * @param identifier The identifier of the game
 * @returns A list of image urls
 * @throws An error if the operation fails
 */
export async function getGameBackgroundsFromVNDB(identifier: ScraperIdentifier): Promise<string[]> {
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
 * Get game cover from VNDB
 * @param identifier The identifier of the game
 * @returns The cover image url
 * @throws An error if the operation fails
 */
export async function getGameCoverFromVNDB(identifier: ScraperIdentifier): Promise<string[]> {
  try {
    const cover =
      identifier.type === 'id'
        ? await getGameCover(identifier.value)
        : await getGameCoverByName(identifier.value)
    return cover ? [cover] : []
  } catch (error) {
    log.error('Error fetching game cover:', error)
    return []
  }
}

import {
  searchDlsiteGames,
  getDlsiteMetadata,
  getGameBackgrounds,
  getGameCover,
  checkGameExists,
  getGameCoverByName,
  getGameBackgroundsByName,
  getDlsiteMetadataByName
} from './common'

import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import log from 'electron-log/main.js'

/**
 * Search for works on DLsite
 * @param gameName Title of the work to be searched
 * @returns List of works
 * @throws Throws an error if the operation fails
 */
export async function searchGamesFromDLsite(gameName: string): Promise<GameList> {
  try {
    const games = await searchDlsiteGames(gameName)
    return games
  } catch (error) {
    log.error('Error while searching for works:', error)
    throw error
  }
}

/**
 * Get work metadata from DLsite
 * @param identifier Work identifier
 * @returns Work metadata
 * @throws Throws an error if the operation fails
 */
export async function getGameMetadataFromDLsite(
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  try {
    const metadata =
      identifier.type === 'id'
        ? await getDlsiteMetadata(identifier.value)
        : await getDlsiteMetadataByName(identifier.value)
    return metadata
  } catch (error) {
    log.error('Error getting metadata for work:', error)
    throw error
  }
}

/**
 * Check if a work exists on DLsite
 * @param dlsiteId Work ID on DLsite
 * @returns A boolean indicating whether the work exists
 * @throws Throws an error if the operation fails
 */
export async function checkGameExistsOnDLsite(dlsiteId: string): Promise<boolean> {
  try {
    const exists = await checkGameExists(dlsiteId)
    return exists
  } catch (error) {
    log.error('Error while checking the existence of a work:', error)
    throw error
  }
}

/**
 * Get work backgrounds from DLsite
 * @param identifier Work identifier
 * @returns Backgrounds of the work
 * @throws Throws an error if the operation fails
 */
export async function getGameBackgroundsFromDLsite(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const images =
      identifier.type === 'id'
        ? await getGameBackgrounds(identifier.value)
        : await getGameBackgroundsByName(identifier.value)
    return images
  } catch (error) {
    log.error('Error getting backgrounds of your work:', error)
    throw error
  }
}

/**
 * Get the cover of the work from DLsite
 * @param identifier Work identifier
 * @returns Cover of the work
 * @throws Throws an error if the operation fails
 */
export async function getGameCoverFromDLsite(identifier: ScraperIdentifier): Promise<string> {
  try {
    const cover =
      identifier.type === 'id'
        ? await getGameCover(identifier.value)
        : await getGameCoverByName(identifier.value)
    return cover
  } catch (error) {
    log.error('Error getting work cover:', error)
    throw error
  }
}

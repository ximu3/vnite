import {
  searchGamesFromDataSource,
  getGameMetadataFromDataSource,
  checkGameExistsInDataSource,
  getGameScreenshotsFromDataSource,
  getGameCoverFromDataSource,
  getGameIconFromDataSource,
  getGameHeroFromDataSource,
  getGameLogoFromDataSource,
  getGameCoversByTitleFromDataSource,
  getGameIconsByTitleFromDataSource,
  getGameLogosByTitleFromDataSource,
  getGameScreenshotsByTitleFromDataSource,
  initScraperServices
} from './common'
import { GameList, GameMetadata } from './types'
import log from 'electron-log/main.js'

/**
 * Search for games on a data source
 * @param dataSource The data source to search
 * @param gameName The name of the game to search for
 * @returns A list of games
 * @throws An error if the operation fails
 */
export async function searchGames(dataSource: string, gameName: string): Promise<GameList> {
  try {
    return await searchGamesFromDataSource(dataSource, gameName)
  } catch (error) {
    log.error(`Failed to search ${gameName} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Check if a game exists on a data source
 * @param dataSource The data source to check
 * @param gameId The id of the game
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExists(dataSource: string, gameId: string): Promise<boolean> {
  try {
    return await checkGameExistsInDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to check ${gameId} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game metadata from a data source
 * @param dataSource The data source to get metadata from
 * @param gameId The id of the game
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadata(dataSource: string, gameId: string): Promise<GameMetadata> {
  try {
    return await getGameMetadataFromDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to get metadata for ${gameId} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game screenshots from a data source
 * @param dataSource The data source to get screenshots from
 * @param gameId The id of the game
 * @returns A list of screenshots
 * @throws An error if the operation fails
 */
export async function getGameScreenshots(dataSource: string, gameId: string): Promise<string[]> {
  try {
    return await getGameScreenshotsFromDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to get images for ${gameId} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game cover from a data source
 * @param dataSource The data source to get cover from
 * @param gameId The id of the game
 * @returns The cover for the game
 * @throws An error if the operation fails
 */
export async function getGameCover(dataSource: string, gameId: string): Promise<string> {
  try {
    return await getGameCoverFromDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to get cover for ${gameId} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game icon from a data source
 * @param dataSource The data source to get icon from
 * @param gameId The id of the game
 * @returns The icon for the game
 * @throws An error if the operation fails
 */
export async function getGameIcon(
  dataSource: string,
  identifier: string | number
): Promise<string> {
  try {
    return await getGameIconFromDataSource(dataSource, identifier)
  } catch (error) {
    log.error(`Failed to get icon for ${identifier} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game hero from a data source
 * @param dataSource The data source to get hero from
 * @param gameId The id of the game
 * @returns The hero for the game
 * @throws An error if the operation fails
 */
export async function getGameHero(
  dataSource: string,
  identifier: string | number
): Promise<string> {
  try {
    return await getGameHeroFromDataSource(dataSource, identifier)
  } catch (error) {
    log.error(`Failed to get hero for ${identifier} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game logo from a data source
 * @param dataSource The data source to get logo from
 * @param gameId The id of the game
 * @returns The logo for the game
 * @throws An error if the operation fails
 */
export async function getGameLogo(
  dataSource: string,
  identifier: string | number
): Promise<string> {
  try {
    return await getGameLogoFromDataSource(dataSource, identifier)
  } catch (error) {
    log.error(`Failed to get logo for ${identifier} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game cover by title from a data source
 * @param dataSource The data source to get cover from
 * @param gameName The name of the game
 * @returns The cover for the game
 * @throws An error if the operation fails
 */
export async function getGameCoversByTitle(
  dataSource: string,
  gameName: string
): Promise<string[]> {
  try {
    return await getGameCoversByTitleFromDataSource(dataSource, gameName)
  } catch (error) {
    log.error(`Failed to get cover for ${gameName} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game icons by title from a data source
 * @param dataSource The data source to get icons from
 * @param gameName The name of the game
 * @returns The icons for the game
 * @throws An error if the operation fails
 */
export async function getGameIconsByTitle(dataSource: string, gameName: string): Promise<string[]> {
  try {
    return await getGameIconsByTitleFromDataSource(dataSource, gameName)
  } catch (error) {
    log.error(`Failed to get icons for ${gameName} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game logos by title from a data source
 * @param dataSource The data source to get logos from
 * @param gameName The name of the game
 * @returns The logos for the game
 * @throws An error if the operation fails
 */
export async function getGameLogosByTitle(dataSource: string, gameName: string): Promise<string[]> {
  try {
    return await getGameLogosByTitleFromDataSource(dataSource, gameName)
  } catch (error) {
    log.error(`Failed to get logos for ${gameName} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Get game screenshots by title from a data source
 * @param dataSource The data source to get screenshots from
 * @param gameName The name of the game
 * @returns A list of screenshots
 * @throws An error if the operation fails
 */
export async function getGameScreenshotsByTitle(
  dataSource: string,
  gameName: string
): Promise<string[]> {
  try {
    return await getGameScreenshotsByTitleFromDataSource(dataSource, gameName)
  } catch (error) {
    log.error(`Failed to get images for ${gameName} from ${dataSource}`, error)
    throw error
  }
}

/**
 * Initialize the scraper services
 * @throws An error if the operation fails
 */
export async function initScraper(): Promise<void> {
  try {
    await initScraperServices()
  } catch (error) {
    log.error('Failed to initialize scraper services', error)
    throw error
  }
}

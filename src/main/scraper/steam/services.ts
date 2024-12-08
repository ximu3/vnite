import {
  getGameCover,
  getGameScreenshots,
  getSteamMetadata,
  checkSteamGameExists,
  searchSteamGames,
  getGameIcon
} from './common'
import { GameList, GameMetadata } from '../types'
import log from 'electron-log/main.js'

/**
 * Search for games on Steam
 * @param gameName The name of the game to search for
 * @returns A list of games
 * @throws An error if the operation fails
 */
export async function searchGamesFromSteam(gameName: string): Promise<GameList> {
  try {
    const games = await searchSteamGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

/**
 * Get game metadata from Steam
 * @param appId The app id of the game on Steam
 * @returns The metadata for the game
 * @throws An error if the operation fails
 */
export async function getGameMetadataFromSteam(appId: string): Promise<GameMetadata> {
  try {
    const metadata = await getSteamMetadata(appId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

/**
 * Check if a game exists on Steam
 * @param appId The app id of the game on Steam
 * @returns A boolean indicating if the game exists
 * @throws An error if the operation fails
 */
export async function checkGameExistsOnSteam(appId: string): Promise<boolean> {
  try {
    const exists = await checkSteamGameExists(appId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

/**
 * Get game screenshots from Steam
 * @param appId The app id of the game on Steam
 * @returns A list of screenshots
 * @throws An error if the operation fails
 */
export async function getGameScreenshotsFromSteam(appId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(appId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

/**
 * Get the cover of the game from Steam
 * @param appId The app id of the game on Steam
 * @returns The cover of the game
 * @throws An error if the operation fails
 */
export async function getGameCoverFromSteam(appId: string): Promise<string> {
  try {
    const cover = await getGameCover(appId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

/**
 * Get the icon of the game from Steam
 * @param appId The app id of the game on Steam
 * @returns The icon of the game
 * @throws An error if the operation fails
 */
export async function getGameIconFromSteam(appId: string): Promise<string> {
  try {
    const icon = await getGameIcon(appId)
    return icon
  } catch (error) {
    log.error('Error fetching game icon:', error)
    throw error
  }
}

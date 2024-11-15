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

export async function searchGamesFromSteam(gameName: string): Promise<GameList> {
  try {
    const games = await searchSteamGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromSteam(appId: string): Promise<GameMetadata> {
  try {
    const metadata = await getSteamMetadata(appId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

export async function checkGameExistsOnSteam(appId: string): Promise<boolean> {
  try {
    const exists = await checkSteamGameExists(appId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

export async function getGameScreenshotsFromSteam(appId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(appId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

export async function getGameCoverFromSteam(appId: string): Promise<string> {
  try {
    const cover = await getGameCover(appId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

export async function getGameIconFromSteam(appId: string): Promise<string> {
  try {
    const icon = await getGameIcon(appId)
    return icon
  } catch (error) {
    log.error('Error fetching game icon:', error)
    throw error
  }
}

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

export async function searchGamesFromIGDB(gameName: string): Promise<GameList> {
  try {
    const games = await searchIGDBGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromIGDB(gameId: string): Promise<GameMetadata> {
  try {
    const metadata = await getIGDBMetadata(gameId)
    return metadata
  } catch (error) {
    log.error('Error fetching game meta', error)
    throw error
  }
}

export async function checkGameExistsOnIGDB(gameId: string): Promise<boolean> {
  try {
    const exists = await checkIGDBGameExists(gameId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

export async function getGameScreenshotsFromIGDB(gameId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(gameId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

export async function getGameCoverFromIGDB(gameId: string): Promise<string> {
  try {
    const cover = await getGameCover(gameId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

export function initIGDBService(): void {
  try {
    initIGDB()
  } catch (error) {
    log.error('Error initializing IGDB service:', error)
    throw error
  }
}

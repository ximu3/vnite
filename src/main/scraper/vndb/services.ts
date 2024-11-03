import {
  searchVNDBGames,
  getVNMetadata,
  checkVNExists,
  getGameScreenshots,
  getGameCover
} from './common'
import { GameList, GameMetadata } from '../types'
import log from 'electron-log/main.js'

export async function searchGamesFromVNDB(gameName: string): Promise<GameList> {
  try {
    const games = await searchVNDBGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromVNDB(vnId: string): Promise<GameMetadata> {
  try {
    const metadata = await getVNMetadata(vnId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

export async function checkGameExistsOnVNDB(vnId: string): Promise<boolean> {
  try {
    const exists = await checkVNExists(vnId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

export async function getGameScreenshotsFromVNDB(vnId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(vnId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

export async function getGameCoverFromVNDB(vnId: string): Promise<string> {
  try {
    const cover = await getGameCover(vnId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

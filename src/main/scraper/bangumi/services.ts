import {
  searchBangumiGames,
  getBangumiMetadata,
  getGameScreenshots,
  getGameCover,
  checkGameExists
} from './common'
import { GameList, GameMetadata } from '../types'
import log from 'electron-log/main.js'

export async function searchGamesFromBangumi(gameName: string): Promise<GameList> {
  try {
    const games = await searchBangumiGames(gameName)
    return games
  } catch (error) {
    log.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromBangumi(bangumiId: string): Promise<GameMetadata> {
  try {
    const metadata = await getBangumiMetadata(bangumiId)
    return metadata
  } catch (error) {
    log.error('Error fetching game metadata:', error)
    throw error
  }
}

export async function checkGameExistsOnBangumi(bangumiId: string): Promise<boolean> {
  try {
    const exists = await checkGameExists(bangumiId)
    return exists
  } catch (error) {
    log.error('Error checking if game exists:', error)
    throw error
  }
}

export async function getGameScreenshotsFromBangumi(bangumiId: string): Promise<string[]> {
  try {
    const images = await getGameScreenshots(bangumiId)
    return images
  } catch (error) {
    log.error('Error fetching game images:', error)
    throw error
  }
}

export async function getGameCoverFromBangumi(bangumiId: string): Promise<string> {
  try {
    const cover = await getGameCover(bangumiId)
    return cover
  } catch (error) {
    log.error('Error fetching game cover:', error)
    throw error
  }
}

import {
  searchGamesFromDataSource,
  getGameMetadataFromDataSource,
  checkGameExistsInDataSource,
  getGameScreenshotsFromDataSource,
  getGameCoverFromDataSource
} from './common'
import { GameList, GameMetadata } from './types'
import log from 'electron-log/main.js'

export async function searchGames(dataSource: string, gameName: string): Promise<GameList> {
  try {
    return await searchGamesFromDataSource(dataSource, gameName)
  } catch (error) {
    log.error(`Failed to search ${gameName} from ${dataSource}`, error)
    throw error
  }
}

export async function checkGameExists(dataSource: string, gameId: string): Promise<boolean> {
  try {
    return await checkGameExistsInDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to check ${gameId} from ${dataSource}`, error)
    throw error
  }
}

export async function getGameMetadata(dataSource: string, gameId: string): Promise<GameMetadata> {
  try {
    return await getGameMetadataFromDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to get metadata for ${gameId} from ${dataSource}`, error)
    throw error
  }
}

export async function getGameScreenshots(dataSource: string, gameId: string): Promise<string[]> {
  try {
    return await getGameScreenshotsFromDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to get images for ${gameId} from ${dataSource}`, error)
    throw error
  }
}

export async function getGameCover(dataSource: string, gameId: string): Promise<string> {
  try {
    return await getGameCoverFromDataSource(dataSource, gameId)
  } catch (error) {
    log.error(`Failed to get cover for ${gameId} from ${dataSource}`, error)
    throw error
  }
}

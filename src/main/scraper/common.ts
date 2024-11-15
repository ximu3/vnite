import {
  searchGamesFromVNDB,
  checkGameExistsOnVNDB,
  getGameMetadataFromVNDB,
  getGameScreenshotsFromVNDB,
  getGameCoverFromVNDB
} from './vndb'
import {
  searchGamesFromSteam,
  checkGameExistsOnSteam,
  getGameMetadataFromSteam,
  getGameScreenshotsFromSteam,
  getGameCoverFromSteam
} from './steam'
import { GameList, GameMetadata } from './types'

export async function searchGamesFromDataSource(
  dataSource: string,
  gameName: string
): Promise<GameList> {
  switch (dataSource) {
    case 'vndb':
      return await searchGamesFromVNDB(gameName)
    case 'steam':
      return await searchGamesFromSteam(gameName)
    default:
      throw new Error('Invalid data source')
  }
}

export async function checkGameExistsInDataSource(
  dataSource: string,
  gameId: string
): Promise<boolean> {
  switch (dataSource) {
    case 'vndb':
      return await checkGameExistsOnVNDB(gameId)
    case 'steam':
      return await checkGameExistsOnSteam(gameId)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameMetadataFromDataSource(
  dataSource: string,
  gameId: string
): Promise<GameMetadata> {
  switch (dataSource) {
    case 'vndb':
      return await getGameMetadataFromVNDB(gameId)
    case 'steam':
      return await getGameMetadataFromSteam(gameId)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameScreenshotsFromDataSource(
  dataSource: string,
  gameId: string
): Promise<string[]> {
  switch (dataSource) {
    case 'vndb':
      return await getGameScreenshotsFromVNDB(gameId)
    case 'steam':
      return await getGameScreenshotsFromSteam(gameId)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameCoverFromDataSource(
  dataSource: string,
  gameId: string
): Promise<string> {
  switch (dataSource) {
    case 'vndb':
      return await getGameCoverFromVNDB(gameId)
    case 'steam':
      return await getGameCoverFromSteam(gameId)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameIconFromDataSource(
  dataSource: string,
  _gameId: string
): Promise<string> {
  switch (dataSource) {
    // case 'steam':
    //   return await getGameIconFromSteam(gameId)
    default:
      return ''
  }
}

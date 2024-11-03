import {
  searchGamesFromVNDB,
  checkGameExistsOnVNDB,
  getGameMetadataFromVNDB,
  getGameScreenshotsFromVNDB,
  getGameCoverFromVNDB
} from './vndb'
import { GameList, GameMetadata } from './types'

export async function searchGamesFromDataSource(
  dataSource: string,
  gameName: string
): Promise<GameList> {
  switch (dataSource) {
    case 'vndb':
      return await searchGamesFromVNDB(gameName)
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
    default:
      throw new Error('Invalid data source')
  }
}

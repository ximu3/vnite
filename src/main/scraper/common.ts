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
import {
  searchGamesFromBangumi,
  checkGameExistsOnBangumi,
  getGameMetadataFromBangumi,
  getGameScreenshotsFromBangumi,
  getGameCoverFromBangumi
} from './bangumi'
import {
  searchGamesFromIGDB,
  checkGameExistsOnIGDB,
  getGameMetadataFromIGDB,
  getGameScreenshotsFromIGDB,
  getGameCoverFromIGDB,
  initIGDBService
} from './igdb'
import {
  searchGamesFromYMGal,
  checkGameExistsOnYMGal,
  getGameMetadataFromYMGal,
  getGameScreenshotsFromYMGal,
  getGameCoverFromYMGal
} from './ymgal'
import {
  getIconFromSteamGridDB,
  getHeroFromSteamGridDB,
  getLogoFromSteamGridDB
} from './steamGridDb'
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
    case 'bangumi':
      return await searchGamesFromBangumi(gameName)
    case 'igdb':
      return await searchGamesFromIGDB(gameName)
    case 'ymgal':
      return await searchGamesFromYMGal(gameName)
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
    case 'bangumi':
      return await checkGameExistsOnBangumi(gameId)
    case 'igdb':
      return await checkGameExistsOnIGDB(gameId)
    case 'ymgal':
      return await checkGameExistsOnYMGal(gameId)
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
    case 'bangumi':
      return await getGameMetadataFromBangumi(gameId)
    case 'igdb':
      return await getGameMetadataFromIGDB(gameId)
    case 'ymgal':
      return await getGameMetadataFromYMGal(gameId)
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
    case 'bangumi':
      return await getGameScreenshotsFromBangumi(gameId)
    case 'igdb':
      return await getGameScreenshotsFromIGDB(gameId)
    case 'ymgal':
      return await getGameScreenshotsFromYMGal(gameId)
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
    case 'bangumi':
      return await getGameCoverFromBangumi(gameId)
    case 'igdb':
      return await getGameCoverFromIGDB(gameId)
    case 'ymgal':
      return await getGameCoverFromYMGal(gameId)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameIconFromDataSource(
  dataSource: string,
  identifier: string | number
): Promise<string> {
  switch (dataSource) {
    case 'steamGridDb':
      return await getIconFromSteamGridDB(identifier)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameHeroFromDataSource(
  dataSource: string,
  identifier: string | number
): Promise<string> {
  switch (dataSource) {
    case 'steamGridDb':
      return await getHeroFromSteamGridDB(identifier)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameLogoFromDataSource(
  dataSource: string,
  identifier: string | number
): Promise<string> {
  switch (dataSource) {
    case 'steamGridDb':
      return await getLogoFromSteamGridDB(identifier)
    default:
      throw new Error('Invalid data source')
  }
}

export async function initScraperServices(): Promise<void> {
  initIGDBService()
}

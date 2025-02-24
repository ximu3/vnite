import {
  searchGamesFromVNDB,
  checkGameExistsOnVNDB,
  getGameMetadataFromVNDB,
  getGameScreenshotsFromVNDB,
  getGameCoverFromVNDB,
  getGameCoverByTitleFromVNDB,
  getGameScreenshotsByTitleFromVNDB
} from './vndb'
import {
  searchGamesFromSteam,
  checkGameExistsOnSteam,
  getGameMetadataFromSteam,
  getGameScreenshotsFromSteam,
  getGameCoverFromSteam,
  getGameCoverByTitleFromSteam,
  getGameScreenshotsByTitleFromSteam
} from './steam'
import {
  searchGamesFromBangumi,
  checkGameExistsOnBangumi,
  getGameMetadataFromBangumi,
  getGameScreenshotsFromBangumi,
  getGameCoverFromBangumi,
  getGameCoverByTitleFromBangumi
} from './bangumi'
import {
  searchGamesFromIGDB,
  checkGameExistsOnIGDB,
  getGameMetadataFromIGDB,
  getGameScreenshotsFromIGDB,
  getGameCoverFromIGDB,
  initIGDBService,
  getGameCoverByTitleFromIGDB,
  getGameScreenshotsByTitleFromIGDB
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
  getLogoFromSteamGridDB,
  getGameGridsFromSteamGridDB,
  getGameHerosFromSteamGridDB,
  getGameIconsFromSteamGridDB,
  getGameLogosFromSteamGridDB
} from './steamGridDb'
import { GameList, GameMetadata } from '@appTypes/utils'

export async function searchGames(dataSource: string, gameName: string): Promise<GameList> {
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

export async function checkGameExists(dataSource: string, gameId: string): Promise<boolean> {
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

export async function getGameMetadata(dataSource: string, gameId: string): Promise<GameMetadata> {
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

export async function getGameScreenshots(dataSource: string, gameId: string): Promise<string[]> {
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

export async function getGameCover(dataSource: string, gameId: string): Promise<string> {
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

export async function getGameIcon(
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

export async function getGameHero(
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

export async function getGameLogo(
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

export async function getGameCoversByTitle(
  dataSource: string,
  gameName: string
): Promise<string[]> {
  switch (dataSource) {
    case 'vndb':
      return await getGameCoverByTitleFromVNDB(gameName).then((cover) => [cover])
    case 'steam':
      return await getGameCoverByTitleFromSteam(gameName).then((cover) => [cover])
    case 'igdb':
      return await getGameCoverByTitleFromIGDB(gameName).then((cover) => [cover])
    case 'bangumi':
      return await getGameCoverByTitleFromBangumi(gameName).then((cover) => [cover])
    case 'steamGridDb':
      return await getGameGridsFromSteamGridDB(gameName)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameScreenshotsByTitle(
  dataSource: string,
  gameName: string
): Promise<string[]> {
  switch (dataSource) {
    case 'vndb':
      return await getGameScreenshotsByTitleFromVNDB(gameName)
    case 'steam':
      return await getGameScreenshotsByTitleFromSteam(gameName)
    case 'igdb':
      return await getGameScreenshotsByTitleFromIGDB(gameName)
    case 'steamGridDb':
      return await getGameHerosFromSteamGridDB(gameName)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameIconsByTitle(
  dataSource: string,
  identifier: string | number
): Promise<string[]> {
  switch (dataSource) {
    case 'steamGridDb':
      return await getGameIconsFromSteamGridDB(identifier)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameLogosByTitle(
  dataSource: string,
  identifier: string | number
): Promise<string[]> {
  switch (dataSource) {
    case 'steamGridDb':
      return await getGameLogosFromSteamGridDB(identifier)
    default:
      throw new Error('Invalid data source')
  }
}

export async function initScraper(): Promise<void> {
  initIGDBService()
}

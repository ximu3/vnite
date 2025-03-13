import {
  searchGamesFromVNDB,
  checkGameExistsOnVNDB,
  getGameMetadataFromVNDB,
  getGameBackgroundsFromVNDB,
  getGameCoverFromVNDB
} from './vndb'
import {
  searchGamesFromSteam,
  checkGameExistsOnSteam,
  getGameMetadataFromSteam,
  getGameCoverFromSteam,
  getGameBackgroundsFromSteam,
  getGameLogoFromSteam
} from './steam'
import {
  searchGamesFromBangumi,
  checkGameExistsOnBangumi,
  getGameMetadataFromBangumi,
  getGameBackgroundsFromBangumi,
  getGameCoverFromBangumi
} from './bangumi'
import {
  searchGamesFromIGDB,
  checkGameExistsOnIGDB,
  getGameMetadataFromIGDB,
  getGameBackgroundsFromIGDB,
  getGameCoverFromIGDB,
  initIGDBService
} from './igdb'
import {
  searchGamesFromYMGal,
  checkGameExistsOnYMGal,
  getGameMetadataFromYMGal,
  getGameBackgroundsFromYMGal,
  getGameCoverFromYMGal
} from './ymgal'
import {
  getGameCoversFromSteamGridDB,
  getGameBackgroundsFromSteamGridDB,
  getGameIconsFromSteamGridDB,
  getGameLogosFromSteamGridDB
} from './steamGridDb'
import {
  searchGamesFromDLsite,
  getGameMetadataFromDLsite,
  getGameCoverFromDLsite,
  getGameBackgroundsFromDLsite,
  checkGameExistsOnDLsite
} from './dlsite'
import { searchGameImages } from '~/media'
import {
  GameList,
  GameMetadata,
  ScraperIdentifier,
  GameDescriptionList,
  GameTagsList
} from '@appTypes/utils'

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
    case 'dlsite':
      return await searchGamesFromDLsite(gameName)
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
    case 'dlsite':
      return await checkGameExistsOnDLsite(gameId)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameMetadata(
  dataSource: string,
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  switch (dataSource) {
    case 'vndb':
      return await getGameMetadataFromVNDB(identifier)
    case 'steam':
      return await getGameMetadataFromSteam(identifier)
    case 'bangumi':
      return await getGameMetadataFromBangumi(identifier)
    case 'igdb':
      return await getGameMetadataFromIGDB(identifier)
    case 'ymgal':
      return await getGameMetadataFromYMGal(identifier)
    case 'dlsite':
      return await getGameMetadataFromDLsite(identifier)
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameBackgrounds(
  dataSource: string,
  identifier: ScraperIdentifier
): Promise<string[]> {
  switch (dataSource) {
    case 'vndb':
      return await getGameBackgroundsFromVNDB(identifier)
    case 'steam':
      return await getGameBackgroundsFromSteam(identifier)
    case 'bangumi':
      return await getGameBackgroundsFromBangumi(identifier)
    case 'igdb':
      return await getGameBackgroundsFromIGDB(identifier)
    case 'ymgal':
      return await getGameBackgroundsFromYMGal(identifier)
    case 'dlsite':
      return await getGameBackgroundsFromDLsite(identifier)
    case 'steamGridDb':
      return await getGameBackgroundsFromSteamGridDB(identifier)
    case 'google':
      return await searchGameImages(identifier.value, 'hero')
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameCovers(
  dataSource: string,
  identifier: ScraperIdentifier
): Promise<string[]> {
  switch (dataSource) {
    case 'vndb':
      return [await getGameCoverFromVNDB(identifier)]
    case 'steam':
      return [await getGameCoverFromSteam(identifier)]
    case 'bangumi':
      return [await getGameCoverFromBangumi(identifier)]
    case 'igdb':
      return [await getGameCoverFromIGDB(identifier)]
    case 'ymgal':
      return [await getGameCoverFromYMGal(identifier)]
    case 'dlsite':
      return [await getGameCoverFromDLsite(identifier)]
    case 'steamGridDb':
      return await getGameCoversFromSteamGridDB(identifier)
    case 'google':
      return await searchGameImages(identifier.value, 'cover')
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameIcons(
  dataSource: string,
  identifier: ScraperIdentifier
): Promise<string[]> {
  switch (dataSource) {
    case 'steamGridDb':
      return await getGameIconsFromSteamGridDB(identifier)
    case 'google':
      return await searchGameImages(identifier.value, 'icon')
    default:
      throw new Error('Invalid data source')
  }
}

export async function getGameLogos(
  dataSource: string,
  identifier: ScraperIdentifier
): Promise<string[]> {
  switch (dataSource) {
    case 'steam':
      return [await getGameLogoFromSteam(identifier)]
    case 'steamGridDb':
      return await getGameLogosFromSteamGridDB(identifier)
    case 'google':
      return await searchGameImages(identifier.value, 'logo')
    default:
      throw new Error('Invalid data source')
  }
}

export async function initScraper(): Promise<void> {
  initIGDBService()
}

export async function getGameDescriptionList(
  identifier: ScraperIdentifier
): Promise<GameDescriptionList> {
  const vndb = await getGameMetadataFromVNDB(identifier)
  const steam = await getGameMetadataFromSteam(identifier)
  const bangumi = await getGameMetadataFromBangumi(identifier)
  const igdb = await getGameMetadataFromIGDB(identifier)
  const ymgal = await getGameMetadataFromYMGal(identifier)
  const dlsite = await getGameMetadataFromDLsite(identifier)

  // 创建候选项数组
  const candidates = [
    steam.description && { dataSource: 'steam', description: steam.description },
    vndb.description && { dataSource: 'vndb', description: vndb.description },
    bangumi.description && { dataSource: 'bangumi', description: bangumi.description },
    igdb.description && { dataSource: 'igdb', description: igdb.description },
    dlsite.description && { dataSource: 'dlsite', description: dlsite.description },
    ymgal.description && { dataSource: 'ymgal', description: ymgal.description }
  ]

  // 过滤掉所有falsy值（包括undefined、null、空字符串等）
  return candidates.filter((item) => item && item.description) as GameDescriptionList
}

export async function getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList> {
  const vndb = await getGameMetadataFromVNDB(identifier)
  const steam = await getGameMetadataFromSteam(identifier)
  const bangumi = await getGameMetadataFromBangumi(identifier)
  const igdb = await getGameMetadataFromIGDB(identifier)
  const ymgal = await getGameMetadataFromYMGal(identifier)
  const dlsite = await getGameMetadataFromDLsite(identifier)

  // 创建候选项数组
  const candidates = [
    steam.tags.length > 0 && { dataSource: 'steam', tags: steam.tags },
    vndb.tags.length > 0 && { dataSource: 'vndb', tags: vndb.tags },
    bangumi.tags.length > 0 && { dataSource: 'bangumi', tags: bangumi.tags },
    igdb.tags.length > 0 && { dataSource: 'igdb', tags: igdb.tags },
    dlsite.tags.length > 0 && { dataSource: 'dlsite', tags: dlsite.tags },
    ymgal.tags.length > 0 && { dataSource: 'ymgal', tags: ymgal.tags }
  ]

  // 过滤掉所有falsy值（包括undefined、null、空字符串等）
  return candidates.filter((item) => item && item.tags) as GameTagsList
}

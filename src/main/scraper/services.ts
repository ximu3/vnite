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
  GameTagsList,
  GameExtraInfoList
} from '@appTypes/utils'
import { Transformer } from '~/database'

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
  let gameMetadata: GameMetadata
  switch (dataSource) {
    case 'vndb':
      gameMetadata = await getGameMetadataFromVNDB(identifier)
      break
    case 'steam':
      gameMetadata = await getGameMetadataFromSteam(identifier)
      break
    case 'bangumi':
      gameMetadata = await getGameMetadataFromBangumi(identifier)
      break
    case 'igdb':
      gameMetadata = await getGameMetadataFromIGDB(identifier)
      break
    case 'ymgal':
      gameMetadata = await getGameMetadataFromYMGal(identifier)
      break
    case 'dlsite':
      gameMetadata = await getGameMetadataFromDLsite(identifier)
      break
    default:
      throw new Error('Invalid data source')
  }
  return Transformer.transformMetadata(gameMetadata)
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
  // Execute all requests in parallel
  const [vndb, steam, bangumi, igdb, ymgal, dlsite] = await Promise.all([
    getGameMetadataFromVNDB(identifier).catch(() => ({
      description: ''
    })),
    getGameMetadataFromSteam(identifier).catch(() => ({
      description: ''
    })),
    getGameMetadataFromBangumi(identifier).catch(() => ({
      description: ''
    })),
    getGameMetadataFromIGDB(identifier).catch(() => ({
      description: ''
    })),
    getGameMetadataFromYMGal(identifier).catch(() => ({
      description: ''
    })),
    getGameMetadataFromDLsite(identifier).catch(() => ({
      description: ''
    }))
  ])

  // Creating a Candidate Array
  const candidates = [
    steam.description && { dataSource: 'steam', description: steam.description },
    vndb.description && { dataSource: 'vndb', description: vndb.description },
    bangumi.description && { dataSource: 'bangumi', description: bangumi.description },
    igdb.description && { dataSource: 'igdb', description: igdb.description },
    dlsite.description && { dataSource: 'dlsite', description: dlsite.description },
    ymgal.description && { dataSource: 'ymgal', description: ymgal.description }
  ]

  // Filter out all false values
  const descriptionList = candidates.filter(
    (item) => item && item.description
  ) as GameDescriptionList
  return await Transformer.transformDescriptionList(descriptionList)
}

export async function getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList> {
  // Execute all requests in parallel
  const [vndb, steam, bangumi, igdb, ymgal, dlsite] = await Promise.all([
    getGameMetadataFromVNDB(identifier).catch(() => ({
      tags: []
    })),
    getGameMetadataFromSteam(identifier).catch(() => ({
      tags: []
    })),
    getGameMetadataFromBangumi(identifier).catch(() => ({
      tags: []
    })),
    getGameMetadataFromIGDB(identifier).catch(() => ({
      tags: []
    })),
    getGameMetadataFromYMGal(identifier).catch(() => ({
      tags: []
    })),
    getGameMetadataFromDLsite(identifier).catch(() => ({
      tags: []
    }))
  ])

  // Creating a Candidate Array
  const candidates = [
    steam.tags.length > 0 && { dataSource: 'steam', tags: steam.tags },
    vndb.tags.length > 0 && { dataSource: 'vndb', tags: vndb.tags },
    bangumi.tags.length > 0 && { dataSource: 'bangumi', tags: bangumi.tags },
    igdb.tags.length > 0 && { dataSource: 'igdb', tags: igdb.tags },
    dlsite.tags.length > 0 && { dataSource: 'dlsite', tags: dlsite.tags },
    ymgal.tags.length > 0 && { dataSource: 'ymgal', tags: ymgal.tags }
  ]

  // Filter out all false values
  const tagsList = candidates.filter((item) => item && item.tags) as GameTagsList
  return await Transformer.transformTagsList(tagsList)
}

export async function getGameExtraInfoList(
  identifier: ScraperIdentifier
): Promise<GameExtraInfoList> {
  // Execute all requests in parallel
  const [vndb, bangumi, ymgal] = await Promise.all([
    getGameMetadataFromVNDB(identifier).catch(() => ({
      extra: []
    })),
    getGameMetadataFromBangumi(identifier).catch(() => ({
      extra: []
    })),
    getGameMetadataFromYMGal(identifier).catch(() => ({
      extra: []
    }))
  ])

  // Creating a Candidate Array
  const candidates = [
    vndb.extra && vndb.extra.length > 0 && { dataSource: 'vndb', extra: vndb.extra },
    bangumi.extra && bangumi.extra.length > 0 && { dataSource: 'bangumi', extra: bangumi.extra },
    ymgal.extra && ymgal.extra.length > 0 && { dataSource: 'ymgal', extra: ymgal.extra }
  ]

  // Filter out all false values
  const extraInfoList = candidates.filter((item) => item && item.extra) as GameExtraInfoList
  return await Transformer.transformExtraInfoList(extraInfoList)
}

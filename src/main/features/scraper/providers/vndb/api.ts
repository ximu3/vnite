import {
  searchVNDBGames,
  getVNMetadata,
  getVNMetadataByName,
  checkVNExists,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName
} from './common'
import { GameList, GameMetadata } from '@appTypes/utils'
import { ScraperIdentifier } from '@appTypes/utils'

export async function searchGamesFromVNDB(gameName: string): Promise<GameList> {
  const games = await searchVNDBGames(gameName)
  return games
}

export async function getGameMetadataFromVNDB(
  identifier: ScraperIdentifier
): Promise<GameMetadata | null> {
  const metadata =
    identifier.type === 'id'
      ? await getVNMetadata(identifier.value)
      : await getVNMetadataByName(identifier.value)
  return metadata
}

export async function checkGameExistsOnVNDB(identifier: ScraperIdentifier): Promise<boolean> {
  if (identifier.type === 'id') {
    return await checkVNExists(identifier.value)
  } else {
    // For name-based search, we can try to get metadata and see if it returns valid results
    return Boolean(await getVNMetadataByName(identifier.value))
  }
}

export async function getGameBackgroundsFromVNDB(identifier: ScraperIdentifier): Promise<string[]> {
  const images =
    identifier.type === 'id'
      ? await getGameBackgrounds(identifier.value)
      : await getGameBackgroundsByName(identifier.value)
  return images
}

export async function getGameCoverFromVNDB(identifier: ScraperIdentifier): Promise<string[]> {
  const cover =
    identifier.type === 'id'
      ? await getGameCover(identifier.value)
      : await getGameCoverByName(identifier.value)
  return cover ? [cover] : []
}

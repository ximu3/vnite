import {
  searchYMGalGames,
  getYMGalMetadata,
  getYMGalMetadataByName,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName,
  checkYMGalExists
} from './common'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'

export async function searchGamesFromYMGal(gameName: string): Promise<GameList> {
  const games = await searchYMGalGames(gameName)
  return games
}

export async function getGameMetadataFromYMGal(
  identifier: ScraperIdentifier
): Promise<GameMetadata | null> {
  const metadata =
    identifier.type === 'id'
      ? await getYMGalMetadata(identifier.value)
      : await getYMGalMetadataByName(identifier.value)
  return metadata
}

export async function checkGameExistsOnYMGal(gameId: string): Promise<boolean> {
  const exists = await checkYMGalExists(gameId)
  return exists
}

export async function getGameBackgroundsFromYMGal(
  identifier: ScraperIdentifier
): Promise<string[]> {
  const images =
    identifier.type === 'id'
      ? await getGameBackgrounds(identifier.value)
      : await getGameBackgroundsByName(identifier.value)
  return images
}

/**
 * Get game cover from YMGal
 * @param identifier The identifier of the game
 * @returns A cover image
 */
export async function getGameCoverFromYMGal(identifier: ScraperIdentifier): Promise<string[]> {
  const cover =
    identifier.type === 'id'
      ? await getGameCover(identifier.value)
      : await getGameCoverByName(identifier.value)
  return cover ? [cover] : []
}

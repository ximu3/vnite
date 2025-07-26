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
  try {
    const games = await searchYMGalGames(gameName)
    return games
  } catch (error) {
    console.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromYMGal(
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  try {
    const metadata =
      identifier.type === 'id'
        ? await getYMGalMetadata(identifier.value)
        : await getYMGalMetadataByName(identifier.value)
    return metadata
  } catch (error) {
    console.error('Error fetching game metadata:', error)
    throw error
  }
}

export async function checkGameExistsOnYMGal(gameId: string): Promise<boolean> {
  try {
    const exists = await checkYMGalExists(gameId)
    return exists
  } catch (error) {
    console.error('Error checking if game exists:', error)
    throw error
  }
}

export async function getGameBackgroundsFromYMGal(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const images =
      identifier.type === 'id'
        ? await getGameBackgrounds(identifier.value)
        : await getGameBackgroundsByName(identifier.value)
    return images
  } catch (error) {
    console.error('Error fetching game backgrounds:', error)
    throw error
  }
}

/**
 * Get game cover from YMGal
 * @param identifier The identifier of the game
 * @returns A cover image
 */
export async function getGameCoverFromYMGal(identifier: ScraperIdentifier): Promise<string[]> {
  try {
    const cover =
      identifier.type === 'id'
        ? await getGameCover(identifier.value)
        : await getGameCoverByName(identifier.value)
    return cover ? [cover] : []
  } catch (error) {
    console.error('Error fetching game cover:', error)
    return []
  }
}

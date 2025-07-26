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
  try {
    const games = await searchVNDBGames(gameName)
    return games
  } catch (error) {
    console.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromVNDB(
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  try {
    const metadata =
      identifier.type === 'id'
        ? await getVNMetadata(identifier.value)
        : await getVNMetadataByName(identifier.value)
    return metadata
  } catch (error) {
    console.error('Error fetching game metadata:', error)
    throw error
  }
}

export async function checkGameExistsOnVNDB(identifier: ScraperIdentifier): Promise<boolean> {
  try {
    if (identifier.type === 'id') {
      const exists = await checkVNExists(identifier.value)
      return exists
    } else {
      // For name-based search, we can try to get metadata and see if it returns valid results
      const metadata = await getVNMetadataByName(identifier.value)
      return metadata.name !== identifier.value || metadata.description !== ''
    }
  } catch (error) {
    console.error('Error checking if game exists:', error)
    return false
  }
}

export async function getGameBackgroundsFromVNDB(identifier: ScraperIdentifier): Promise<string[]> {
  try {
    const images =
      identifier.type === 'id'
        ? await getGameBackgrounds(identifier.value)
        : await getGameBackgroundsByName(identifier.value)
    return images
  } catch (error) {
    console.error('Error fetching game images:', error)
    throw error
  }
}

export async function getGameCoverFromVNDB(identifier: ScraperIdentifier): Promise<string[]> {
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

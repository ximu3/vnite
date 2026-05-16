import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import {
  checkSteamGameExists,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName,
  getGameHeader,
  getGameHeaderByName,
  getGameLogo,
  getGameLogoByName,
  getSteamMetadata,
  getSteamMetadataByName,
  searchSteamGames
} from './common'

export async function searchGamesFromSteam(gameName: string): Promise<GameList> {
  try {
    const games = await searchSteamGames(gameName)
    return games
  } catch (error) {
    console.error('Error searching for games:', error)
    throw error
  }
}

export async function getGameMetadataFromSteam(
  identifier: ScraperIdentifier
): Promise<GameMetadata> {
  try {
    const metadata =
      identifier.type === 'id'
        ? await getSteamMetadata(identifier.value)
        : await getSteamMetadataByName(identifier.value)
    return metadata
  } catch (error) {
    console.error('Error fetching game metadata:', error)
    throw error
  }
}

export async function checkGameExistsOnSteam(appId: string): Promise<boolean> {
  try {
    const exists = await checkSteamGameExists(appId)
    return exists
  } catch (error) {
    console.error('Error checking if game exists:', error)
    throw error
  }
}

export async function getGameBackgroundsFromSteam(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const backgrounds =
      identifier.type === 'id'
        ? await getGameBackgrounds(identifier.value)
        : await getGameBackgroundsByName(identifier.value)
    return backgrounds.length > 0 ? backgrounds : []
  } catch (error) {
    console.error('Error fetching game backgrounds:', error)
    return []
  }
}

export async function getGameWideCoversFromSteam(identifier: ScraperIdentifier): Promise<string[]> {
  try {
    const wideCover =
      identifier.type === 'id'
        ? await getGameHeader(identifier.value)
        : await getGameHeaderByName(identifier.value)
    return wideCover ? [wideCover] : []
  } catch (error) {
    console.error('Error fetching game wide cover:', error)
    return []
  }
}

export async function getGameCoversFromSteam(identifier: ScraperIdentifier): Promise<string[]> {
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

export async function getGameLogosFromSteam(identifier: ScraperIdentifier): Promise<string[]> {
  try {
    const logo =
      identifier.type === 'id'
        ? await getGameLogo(identifier.value)
        : await getGameLogoByName(identifier.value)
    return logo ? [logo] : []
  } catch (error) {
    console.error('Error fetching game logo:', error)
    return []
  }
}

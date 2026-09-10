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
  const games = await searchSteamGames(gameName)
  return games
}

export async function getGameMetadataFromSteam(
  identifier: ScraperIdentifier
): Promise<GameMetadata | null> {
  const metadata =
    identifier.type === 'id'
      ? await getSteamMetadata(identifier.value)
      : await getSteamMetadataByName(identifier.value)
  return metadata
}

export async function checkGameExistsOnSteam(appId: string): Promise<boolean> {
  const exists = await checkSteamGameExists(appId)
  return exists
}

export async function getGameBackgroundsFromSteam(
  identifier: ScraperIdentifier
): Promise<string[]> {
  const backgrounds =
    identifier.type === 'id'
      ? await getGameBackgrounds(identifier.value)
      : await getGameBackgroundsByName(identifier.value)
  return backgrounds.length > 0 ? backgrounds : []
}

export async function getGameWideCoversFromSteam(identifier: ScraperIdentifier): Promise<string[]> {
  const wideCover =
    identifier.type === 'id'
      ? await getGameHeader(identifier.value)
      : await getGameHeaderByName(identifier.value)
  return wideCover ? [wideCover] : []
}

export async function getGameCoversFromSteam(identifier: ScraperIdentifier): Promise<string[]> {
  const cover =
    identifier.type === 'id'
      ? await getGameCover(identifier.value)
      : await getGameCoverByName(identifier.value)
  return cover ? [cover] : []
}

export async function getGameLogosFromSteam(identifier: ScraperIdentifier): Promise<string[]> {
  const logo =
    identifier.type === 'id'
      ? await getGameLogo(identifier.value)
      : await getGameLogoByName(identifier.value)
  return logo ? [logo] : []
}

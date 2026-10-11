import {
  getGameCovers,
  getGameCoversByName,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameIcons,
  getGameIconsByName,
  getGameLogos,
  getGameLogosByName
} from './common'
import { ScraperIdentifier } from '@appTypes/utils'

export async function getGameIconsFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  return identifier.type === 'id'
    ? await getGameIcons(identifier.value)
    : await getGameIconsByName(identifier.value)
}

export async function getGameBackgroundsFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  return identifier.type === 'id'
    ? await getGameBackgrounds(identifier.value)
    : await getGameBackgroundsByName(identifier.value)
}

export async function getGameLogosFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  return identifier.type === 'id'
    ? await getGameLogos(identifier.value)
    : await getGameLogosByName(identifier.value)
}

export async function getGameCoversFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  return identifier.type === 'id'
    ? await getGameCovers(identifier.value)
    : await getGameCoversByName(identifier.value)
}

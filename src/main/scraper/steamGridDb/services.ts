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
import log from 'electron-log/main.js'
import { ScraperIdentifier } from '@appTypes/database'

export async function getGameIconsFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const icons =
      identifier.type === 'id'
        ? await getGameIcons(identifier.value)
        : await getGameIconsByName(identifier.value)
    return icons
  } catch (error) {
    log.error(`Error getting SteamGridDB icons: ${error}`)
  }
  return []
}

export async function getGameBackgroundsFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const heroes =
      identifier.type === 'id'
        ? await getGameBackgrounds(identifier.value)
        : await getGameBackgroundsByName(identifier.value)
    return heroes
  } catch (error) {
    log.error(`Error Getting SteamGridDB Background: ${error}`)
  }
  return []
}

export async function getGameLogosFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const logos =
      identifier.type === 'id'
        ? await getGameLogos(identifier.value)
        : await getGameLogosByName(identifier.value)
    return logos
  } catch (error) {
    log.error(`Error Getting SteamGridDB Logo: ${error}`)
  }
  return []
}

export async function getGameCoversFromSteamGridDB(
  identifier: ScraperIdentifier
): Promise<string[]> {
  try {
    const covers =
      identifier.type === 'id'
        ? await getGameCovers(identifier.value)
        : await getGameCoversByName(identifier.value)
    return covers
  } catch (error) {
    log.error(`Error getting SteamGridDB Grids: ${error}`)
  }
  return []
}

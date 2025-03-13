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
    log.error(`获取 SteamGridDB 图标时出错: ${error}`)
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
    log.error(`获取 SteamGridDB Background 时出错: ${error}`)
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
    log.error(`获取 SteamGridDB Logo 时出错: ${error}`)
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
    log.error(`获取 SteamGridDB Grids 时出错: ${error}`)
  }
  return []
}

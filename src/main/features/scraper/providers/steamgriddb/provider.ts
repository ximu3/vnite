import { ScraperProvider } from '../../services/types'
import { ScraperIdentifier } from '@appTypes/utils'
import {
  getGameCoversFromSteamGridDB,
  getGameBackgroundsFromSteamGridDB,
  getGameLogosFromSteamGridDB,
  getGameIconsFromSteamGridDB
} from './api'

export const steamGridDBProvider: ScraperProvider = {
  id: 'steamgriddb',
  name: 'SteamGridDB',

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameCoversFromSteamGridDB(identifier)
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameBackgroundsFromSteamGridDB(identifier)
  },

  async getGameLogos(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameLogosFromSteamGridDB(identifier)
  },

  async getGameIcons(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameIconsFromSteamGridDB(identifier)
  }
}

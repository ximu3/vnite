import { ScraperProvider } from '../../services/types'
import {
  searchGamesFromVNDB,
  getGameMetadataFromVNDB,
  checkGameExistsOnVNDB,
  getGameBackgroundsFromVNDB,
  getGameCoverFromVNDB
} from './api'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'

export const vndbProvider: ScraperProvider = {
  id: 'vndb',
  name: 'VNDB',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchGamesFromVNDB(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    return await checkGameExistsOnVNDB(identifier)
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    return await getGameMetadataFromVNDB(identifier)
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameBackgroundsFromVNDB(identifier)
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameCoverFromVNDB(identifier)
  }
}

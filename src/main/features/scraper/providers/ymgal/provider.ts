import { ScraperProvider } from '../../services/types'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import {
  searchGamesFromYMGal,
  getGameMetadataFromYMGal,
  checkGameExistsOnYMGal,
  getGameBackgroundsFromYMGal,
  getGameCoverFromYMGal
} from './api'

export const ymgalProvider: ScraperProvider = {
  id: 'ymgal',
  name: 'YMGal',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchGamesFromYMGal(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkGameExistsOnYMGal(identifier.value)
    }
    // For name-based checks, try to search and see if we get results
    try {
      const games = await searchGamesFromYMGal(identifier.value)
      return games.length > 0
    } catch {
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    return await getGameMetadataFromYMGal(identifier)
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameBackgroundsFromYMGal(identifier)
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameCoverFromYMGal(identifier)
  }
}

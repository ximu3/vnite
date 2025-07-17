import { ScraperProvider } from '../../services/types'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import {
  searchGamesFromSteam,
  getGameMetadataFromSteam,
  checkGameExistsOnSteam,
  getGameBackgroundsFromSteam,
  getGameCoversFromSteam,
  getGameLogosFromSteam
} from './api'

export const steamProvider: ScraperProvider = {
  id: 'steam',
  name: 'Steam',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchGamesFromSteam(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkGameExistsOnSteam(identifier.value)
    }
    // For name-based checks, try to search and see if we get results
    try {
      const games = await searchGamesFromSteam(identifier.value)
      return games.length > 0
    } catch {
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    return await getGameMetadataFromSteam(identifier)
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameBackgroundsFromSteam(identifier)
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameCoversFromSteam(identifier)
  },

  async getGameLogos(identifier: ScraperIdentifier): Promise<string[]> {
    return await getGameLogosFromSteam(identifier)
  }
}

import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import { ScraperProvider } from '../../services/types'
import {
  checkEsGameExists,
  getEsGameBackgrounds,
  getEsGameCovers,
  getEsGameMetadata,
  searchEsGames
} from './common'

export const erogamescapeProvider: ScraperProvider = {
  id: 'erogamescape',
  name: 'ErogameScape',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchEsGames(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkEsGameExists(identifier.value)
    } else {
      const games = await searchEsGames(identifier.value)
      return games.length > 0
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata | null> {
    return await getEsGameMetadata(identifier)
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    return await getEsGameBackgrounds(identifier)
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    return await getEsGameCovers(identifier)
  }
}

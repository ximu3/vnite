import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import { ScraperProvider } from '../../services/types'
import { checkFanzaGameExists, getFanzaGameMetadata, searchFanzaGames } from './common'

export const fanzaProvider: ScraperProvider = {
  id: 'fanza',
  name: 'FANZA',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchFanzaGames(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkFanzaGameExists(identifier.value)
    } else {
      const games = await searchFanzaGames(identifier.value)
      return games.length > 0
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata | null> {
    return await getFanzaGameMetadata(identifier)
  }
}

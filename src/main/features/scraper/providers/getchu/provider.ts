import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import { ScraperProvider } from '../../services/types'
import { checkGetchuGameExists, getGetchuGameMetadata, searchGetchuGames } from './common'

export const getchuProvider: ScraperProvider = {
  id: 'getchu',
  name: 'Getchu',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchGetchuGames(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkGetchuGameExists(identifier.value)
    } else {
      const games = await searchGetchuGames(identifier.value)
      return games.length > 0
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata | null> {
    return await getGetchuGameMetadata(identifier)
  }
}

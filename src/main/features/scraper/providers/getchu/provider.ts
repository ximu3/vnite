import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import log from 'electron-log/main.js'
import { ScraperProvider } from '../../services/types'
import { checkGetchuGameExists, getGetchuGameMetadata, searchGetchuGames } from './common'

export const getchuProvider: ScraperProvider = {
  id: 'getchu',
  name: 'Getchu',

  async searchGames(gameName: string): Promise<GameList> {
    try {
      const gameList = await searchGetchuGames(gameName)
      return gameList
    } catch (error) {
      log.error('Getchu search games error:', error)
      return []
    }
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    try {
      if (identifier.type === 'id') {
        return await checkGetchuGameExists(identifier.value)
      } else {
        const games = await searchGetchuGames(identifier.value)
        return games.length > 0
      }
    } catch (error) {
      log.error('Getchu check game exists error:', error)
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    try {
      return await getGetchuGameMetadata(identifier)
    } catch (error) {
      log.error('Getchu get game metadata error:', error)
      throw error
    }
  }
}

import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import log from 'electron-log/main.js'
import { ScraperProvider } from '../../services/types'
import { checkFanzaGameExists, getFanzaGameMetadata, searchFanzaGames } from './common'

export const fanzaProvider: ScraperProvider = {
  id: 'fanza',
  name: 'FANZA',

  async searchGames(gameName: string): Promise<GameList> {
    try {
      const gameList = await searchFanzaGames(gameName)
      return gameList
    } catch (error) {
      log.error('Fanza search games error:', error)
      return []
    }
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    try {
      if (identifier.type === 'id') {
        return await checkFanzaGameExists(identifier.value)
      } else {
        const games = await searchFanzaGames(identifier.value)
        return games.length > 0
      }
    } catch (error) {
      log.error('Fanza check game exists error:', error)
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    try {
      return await getFanzaGameMetadata(identifier)
    } catch (error) {
      log.error('Fanza get game metadata error:', error)
      throw error
    }
  }
}

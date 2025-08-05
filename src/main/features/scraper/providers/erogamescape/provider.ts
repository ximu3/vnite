import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import log from 'electron-log/main.js'
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
    try {
      const gameList = await searchEsGames(gameName)
      return gameList
    } catch (error) {
      log.error('ErogameScape search games error:', error)
      return []
    }
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    try {
      if (identifier.type === 'id') {
        return await checkEsGameExists(identifier.value)
      } else {
        const games = await searchEsGames(identifier.value)
        return games.length > 0
      }
    } catch (error) {
      log.error('ErogameScape check game exists error:', error)
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    try {
      return await getEsGameMetadata(identifier)
    } catch (error) {
      log.error('ErogameScape get game metadata error:', error)
      throw error
    }
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    try {
      return await getEsGameBackgrounds(identifier)
    } catch (error) {
      log.error('ErogameScape get game backgrounds error:', error)
      return []
    }
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    try {
      return await getEsGameCovers(identifier)
    } catch (error) {
      log.error('ErogameScape get game covers error:', error)
      return []
    }
  }
}

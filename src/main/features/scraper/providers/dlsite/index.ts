import { ScraperProvider } from '../../services/types'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import {
  searchDlsiteGames,
  getDlsiteMetadata,
  getDlsiteMetadataByName,
  checkGameExists,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName
} from './common'
import log from 'electron-log/main.js'

export const dlsiteProvider: ScraperProvider = {
  id: 'dlsite',
  name: 'DLsite',

  async searchGames(gameName: string): Promise<GameList> {
    try {
      return await searchDlsiteGames(gameName)
    } catch (error) {
      log.error('DLsite search games error:', error)
      return []
    }
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    try {
      if (identifier.type === 'id') {
        return await checkGameExists(identifier.value)
      } else {
        // For name-based checks, search and see if we get results
        const games = await searchDlsiteGames(identifier.value)
        return games.length > 0
      }
    } catch (error) {
      log.error('DLsite check game exists error:', error)
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    try {
      if (identifier.type === 'id') {
        return await getDlsiteMetadata(identifier.value)
      } else {
        return await getDlsiteMetadataByName(identifier.value)
      }
    } catch (error) {
      log.error('DLsite get game metadata error:', error)
      throw error
    }
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    try {
      if (identifier.type === 'id') {
        return await getGameBackgrounds(identifier.value)
      } else {
        return await getGameBackgroundsByName(identifier.value)
      }
    } catch (error) {
      log.error('DLsite get game backgrounds error:', error)
      return []
    }
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    try {
      let coverUrl: string
      if (identifier.type === 'id') {
        coverUrl = await getGameCover(identifier.value)
      } else {
        coverUrl = await getGameCoverByName(identifier.value)
      }
      return coverUrl ? [coverUrl] : []
    } catch (error) {
      log.error('DLsite get game covers error:', error)
      return []
    }
  }
}

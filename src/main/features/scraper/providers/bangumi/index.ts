import { ScraperProvider } from '../../services/types'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import {
  searchBangumiGames,
  getBangumiMetadata,
  getBangumiMetadataByName,
  checkGameExists,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName
} from './common'
import log from 'electron-log/main.js'

export const bangumiProvider: ScraperProvider = {
  id: 'bangumi',
  name: 'Bangumi',

  async searchGames(gameName: string): Promise<GameList> {
    try {
      return await searchBangumiGames(gameName)
    } catch (error) {
      log.error('Bangumi search games error:', error)
      return []
    }
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    try {
      if (identifier.type === 'id') {
        return await checkGameExists(identifier.value)
      } else {
        // For name-based checks, search and see if we get results
        const games = await searchBangumiGames(identifier.value)
        return games.length > 0
      }
    } catch (error) {
      log.error('Bangumi check game exists error:', error)
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    try {
      if (identifier.type === 'id') {
        return await getBangumiMetadata(identifier.value)
      } else {
        return await getBangumiMetadataByName(identifier.value)
      }
    } catch (error) {
      log.error('Bangumi get game metadata error:', error)
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
      log.error('Bangumi get game backgrounds error:', error)
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
      log.error('Bangumi get game covers error:', error)
      return []
    }
  }
}

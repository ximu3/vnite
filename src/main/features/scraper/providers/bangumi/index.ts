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

/**
 * Bangumi Scraper Provider
 * Provides game metadata from Bangumi - The ACGN subject database
 */
export const bangumiProvider: ScraperProvider = {
  id: 'bangumi',
  name: 'Bangumi',

  /**
   * Search for games on Bangumi
   */
  async searchGames(gameName: string): Promise<GameList> {
    try {
      return await searchBangumiGames(gameName)
    } catch (error) {
      log.error('Bangumi search games error:', error)
      return []
    }
  },

  /**
   * Check if a game exists on Bangumi
   */
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

  /**
   * Get game metadata from Bangumi
   */
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

  /**
   * Get game backgrounds from Bangumi (via VNDB integration)
   */
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

  /**
   * Get game covers from Bangumi
   */
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

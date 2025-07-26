import { ScraperProvider } from '../../services/types'
import { GameList, GameMetadata, ScraperIdentifier } from '@appTypes/utils'
import {
  searchIGDBGames,
  getIGDBMetadata,
  getIGDBMetadataByName,
  checkIGDBGameExists,
  getGameBackgrounds,
  getGameBackgroundsByName,
  getGameCover,
  getGameCoverByName
} from './common'
import log from 'electron-log/main.js'

export const igdbProvider: ScraperProvider = {
  id: 'igdb',
  name: 'IGDB',

  async searchGames(gameName: string): Promise<GameList> {
    try {
      return await searchIGDBGames(gameName)
    } catch (error) {
      log.error('IGDB search games error:', error)
      return []
    }
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    try {
      if (identifier.type === 'id') {
        return await checkIGDBGameExists(identifier.value)
      } else {
        // For name-based checks, search and see if we get results
        const games = await searchIGDBGames(identifier.value)
        return games.length > 0
      }
    } catch (error) {
      log.error('IGDB check game exists error:', error)
      return false
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata> {
    try {
      if (identifier.type === 'id') {
        return await getIGDBMetadata(identifier.value)
      } else {
        return await getIGDBMetadataByName(identifier.value)
      }
    } catch (error) {
      log.error('IGDB get game metadata error:', error)
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
      log.error('IGDB get game backgrounds error:', error)
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
      log.error('IGDB get game covers error:', error)
      return []
    }
  }
}

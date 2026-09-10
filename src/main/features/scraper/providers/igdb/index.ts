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

export const igdbProvider: ScraperProvider = {
  id: 'igdb',
  name: 'IGDB',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchIGDBGames(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkIGDBGameExists(identifier.value)
    } else {
      // For name-based checks, search and see if we get results
      const games = await searchIGDBGames(identifier.value)
      return games.length > 0
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata | null> {
    if (identifier.type === 'id') {
      return await getIGDBMetadata(identifier.value)
    } else {
      return await getIGDBMetadataByName(identifier.value)
    }
  },

  async getGameBackgrounds(identifier: ScraperIdentifier): Promise<string[]> {
    if (identifier.type === 'id') {
      return await getGameBackgrounds(identifier.value)
    } else {
      return await getGameBackgroundsByName(identifier.value)
    }
  },

  async getGameCovers(identifier: ScraperIdentifier): Promise<string[]> {
    let coverUrl: string
    if (identifier.type === 'id') {
      coverUrl = await getGameCover(identifier.value)
    } else {
      coverUrl = await getGameCoverByName(identifier.value)
    }
    return coverUrl ? [coverUrl] : []
  }
}

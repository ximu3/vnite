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

export const bangumiProvider: ScraperProvider = {
  id: 'bangumi',
  name: 'Bangumi',

  async searchGames(gameName: string): Promise<GameList> {
    return await searchBangumiGames(gameName)
  },

  async checkGameExists(identifier: ScraperIdentifier): Promise<boolean> {
    if (identifier.type === 'id') {
      return await checkGameExists(identifier.value)
    } else {
      // For name-based checks, search and see if we get results
      const games = await searchBangumiGames(identifier.value)
      return games.length > 0
    }
  },

  async getGameMetadata(identifier: ScraperIdentifier): Promise<GameMetadata | null> {
    if (identifier.type === 'id') {
      return await getBangumiMetadata(identifier.value)
    } else {
      return await getBangumiMetadataByName(identifier.value)
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

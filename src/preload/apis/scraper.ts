import { ipcRenderer } from 'electron'
import type {
  GameMetadata,
  GameList,
  GameDescriptionList,
  GameTagsList,
  GameExtraInfoList
} from '../../types/utils'
import type { ScraperIdentifier } from '../../types/database'

export const scraperAPI = {
  async searchGames(dataSource: string, gameName: string): Promise<GameList> {
    return await ipcRenderer.invoke('search-games', dataSource, gameName)
  },

  async checkGameExists(dataSource: string, gameId: string): Promise<boolean> {
    return await ipcRenderer.invoke('check-game-exists', dataSource, gameId)
  },

  async getGameMetadata(dataSource: string, identifier: ScraperIdentifier): Promise<GameMetadata> {
    return await ipcRenderer.invoke('get-game-metadata', dataSource, identifier)
  },

  async getGameBackgrounds(dataSource: string, identifier: ScraperIdentifier): Promise<string[]> {
    return await ipcRenderer.invoke('get-game-backgrounds', dataSource, identifier)
  },

  async getGameCovers(dataSource: string, identifier: ScraperIdentifier): Promise<string[]> {
    return await ipcRenderer.invoke('get-game-covers', dataSource, identifier)
  },

  async getGameIcons(dataSource: string, identifier: ScraperIdentifier): Promise<string[]> {
    return await ipcRenderer.invoke('get-game-icons', dataSource, identifier)
  },

  async getGameLogos(dataSource: string, identifier: ScraperIdentifier): Promise<string[]> {
    return await ipcRenderer.invoke('get-game-logos', dataSource, identifier)
  },

  async getGameDescriptionList(identifier: ScraperIdentifier): Promise<GameDescriptionList> {
    return await ipcRenderer.invoke('get-game-description-list', identifier)
  },

  async getGameTagsList(identifier: ScraperIdentifier): Promise<GameTagsList> {
    return await ipcRenderer.invoke('get-game-tags-list', identifier)
  },

  async getGameExtraInfoList(identifier: ScraperIdentifier): Promise<GameExtraInfoList> {
    return await ipcRenderer.invoke('get-game-extra-info-list', identifier)
  }
}

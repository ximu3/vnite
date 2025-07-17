import { scraperManager } from './services'
import { ScraperIdentifier } from '@appTypes/utils'
import { ipcManager } from '~/core/ipc'
import { ScraperCapabilities } from './services/types'

export function setupScraperIPC(): void {
  ipcManager.handle('scraper:search-games', async (_, dataSource: string, gameName: string) => {
    return await scraperManager.searchGames(dataSource, gameName)
  })

  ipcManager.handle(
    'scraper:check-game-exists',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await scraperManager.checkGameExists(dataSource, identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-game-metadata',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameMetadata(dataSource, identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-game-backgrounds',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameBackgrounds(dataSource, identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-game-covers',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameCovers(dataSource, identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-game-icons',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameIcons(dataSource, identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-game-logos',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameLogos(dataSource, identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-game-description-list',
    async (_, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameDescriptionList(identifier)
    }
  )

  ipcManager.handle('scraper:get-game-tags-list', async (_, identifier: ScraperIdentifier) => {
    return await scraperManager.getGameTagsList(identifier)
  })

  ipcManager.handle(
    'scraper:get-game-extra-info-list',
    async (_, identifier: ScraperIdentifier) => {
      return await scraperManager.getGameExtraInfoList(identifier)
    }
  )

  ipcManager.handle(
    'scraper:get-provider-infos-with-capabilities',
    async (_, capabilities: ScraperCapabilities[], requireAll = true) => {
      return scraperManager.getProviderInfosWithCapabilities(capabilities, requireAll)
    }
  )
}

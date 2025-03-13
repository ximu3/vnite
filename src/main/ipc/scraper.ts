import {
  searchGames,
  getGameMetadata,
  checkGameExists,
  getGameBackgrounds,
  getGameCovers,
  getGameIcons,
  getGameLogos,
  getGameDescriptionList,
  getGameTagsList
} from '~/scraper'
import { ipcMain, BrowserWindow } from 'electron'
import { ScraperIdentifier } from '@appTypes/database'

export function setupScraperIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('search-games', async (_, dataSource: string, gameName: string) => {
    return await searchGames(dataSource, gameName)
  })

  ipcMain.handle('check-game-exists', async (_, dataSource: string, gameId: string) => {
    return await checkGameExists(dataSource, gameId)
  })

  ipcMain.handle(
    'get-game-metadata',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await getGameMetadata(dataSource, identifier)
    }
  )

  ipcMain.handle(
    'get-game-backgrounds',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await getGameBackgrounds(dataSource, identifier)
    }
  )

  ipcMain.handle(
    'get-game-covers',
    async (_, dataSource: string, identifier: ScraperIdentifier) => {
      return await getGameCovers(dataSource, identifier)
    }
  )

  ipcMain.handle('get-game-icons', async (_, dataSource: string, identifier: ScraperIdentifier) => {
    return await getGameIcons(dataSource, identifier)
  })

  ipcMain.handle('get-game-logos', async (_, dataSource: string, identifier: ScraperIdentifier) => {
    return await getGameLogos(dataSource, identifier)
  })

  ipcMain.handle('get-game-description-list', async (_, identifier: ScraperIdentifier) => {
    return await getGameDescriptionList(identifier)
  })

  ipcMain.handle('get-game-tags-list', async (_, identifier: ScraperIdentifier) => {
    return await getGameTagsList(identifier)
  })

  mainWindow.webContents.send('scraperIPCReady')
}

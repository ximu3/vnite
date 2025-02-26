import {
  searchGames,
  getGameMetadata,
  checkGameExists,
  getGameScreenshots,
  getGameCoversByTitle,
  getGameIconsByTitle,
  getGameLogosByTitle,
  getGameScreenshotsByTitle
} from '~/scraper'
import { ipcMain, BrowserWindow } from 'electron'

export function setupScraperIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('search-games', async (_, dataSource: string, gameName: string) => {
    return await searchGames(dataSource, gameName)
  })

  ipcMain.handle('check-game-exists', async (_, dataSource: string, gameId: string) => {
    return await checkGameExists(dataSource, gameId)
  })

  ipcMain.handle('get-game-metadata', async (_, dataSource: string, gameId: string) => {
    return await getGameMetadata(dataSource, gameId)
  })

  ipcMain.handle('get-game-screenshots', async (_, dataSource: string, gameId: string) => {
    return await getGameScreenshots(dataSource, gameId)
  })

  ipcMain.handle('get-game-covers-by-title', async (_, dataSource: string, gameTitle: string) => {
    return await getGameCoversByTitle(dataSource, gameTitle)
  })

  ipcMain.handle('get-game-icons-by-title', async (_, dataSource: string, gameTitle: string) => {
    return await getGameIconsByTitle(dataSource, gameTitle)
  })

  ipcMain.handle('get-game-logos-by-title', async (_, dataSource: string, gameTitle: string) => {
    return await getGameLogosByTitle(dataSource, gameTitle)
  })

  ipcMain.handle(
    'get-game-screenshots-by-title',
    async (_, dataSource: string, gameTitle: string) => {
      return await getGameScreenshotsByTitle(dataSource, gameTitle)
    }
  )

  mainWindow.webContents.send('scraperIPCReady')
}

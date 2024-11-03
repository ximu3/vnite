import { searchGames, getGameMetadata, checkGameExists, getGameScreenshots } from '~/scraper'
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

  mainWindow.webContents.send('scraperIPCReady')
}

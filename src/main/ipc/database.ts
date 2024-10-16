import { ipcMain, BrowserWindow } from 'electron'
import { setDBValue, getDBValue, getGamesMetadata } from '~/database'

export function setupDatabaseIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('set-db-value', async (_, dbName: string, path: string[], value: any) => {
    await setDBValue(dbName, path, value)
  })

  ipcMain.handle('get-db-value', async (_, dbName: string, path: string[], defaultValue: any) => {
    return await getDBValue(dbName, path, defaultValue)
  })

  ipcMain.handle('get-games-metadata', async () => {
    return await getGamesMetadata()
  })

  ipcMain.on('reload-db-values', (_, dbName: string) => {
    mainWindow.webContents.send('reload-db-values', dbName)
  })

  ipcMain.on('games-changed', () => {
    mainWindow.webContents.send('rebuild-index')
  })

  mainWindow.webContents.send('databaseIPCReady')
}

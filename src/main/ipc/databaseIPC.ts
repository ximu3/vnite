import { ipcMain, BrowserWindow } from 'electron'
import { setDBValue, getDBValue } from '~/database/index.js'

export function setupDatabaseIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('setDBValue', async (_, dbName: string, path: string[], value: any) => {
    await setDBValue(dbName, path, value)
  })

  ipcMain.handle('getDBValue', async (_, dbName: string, path: string[], defaultValue: any) => {
    return await getDBValue(dbName, path, defaultValue)
  })

  mainWindow.webContents.send('databaseReady')
}

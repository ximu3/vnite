import { autoUpdater } from 'electron-updater'
import { ipcMain, BrowserWindow } from 'electron'

export function setupUpdaterIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('check-update', async () => {
    return await autoUpdater.checkForUpdates()
  })

  mainWindow.webContents.send('updaterIPCReady')
}

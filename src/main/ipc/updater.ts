import { autoUpdater } from 'electron-updater'
import { ipcMain, BrowserWindow } from 'electron'

export function setupUpdaterIPC(mainWindow: BrowserWindow): void {
  ipcMain.on('check-update', () => {
    return autoUpdater.checkForUpdates()
  })

  mainWindow.webContents.send('updaterIPCReady')
}

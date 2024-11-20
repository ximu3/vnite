import { BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false

  autoUpdater.on('update-available', (info) => {
    const updateInfo = {
      version: info.version,
      releaseNotes: Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((note) => note.note).join('\n')
        : info.releaseNotes || ''
    }
    mainWindow?.webContents.send('update-available', updateInfo)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
  })

  ipcMain.handle('start-update', () => {
    return autoUpdater.downloadUpdate()
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  autoUpdater.checkForUpdates()
}

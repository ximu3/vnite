import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'
import { updateUpdater } from './services'
import { ipcManager } from '~/core/ipc'

export function setupUpdaterIPC(): void {
  ipcManager.handle('updater:check-update', async () => {
    return await autoUpdater.checkForUpdates()
  })

  ipcManager.handle('updater:start-update', async () => {
    try {
      return await autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('Failed to download update:', error)
      throw error
    }
  })

  ipcManager.handle('updater:install-update', async () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Add handler for updating auto-updater configuration
  ipcManager.handle('updater:update-config', async () => {
    try {
      await updateUpdater()
    } catch (error) {
      log.error('Failed to update auto-updater configuration:', error)
      throw error
    }
  })
}

import { ipcMain, BrowserWindow } from 'electron'
import { CloudSyncService } from '~/cloudSync'

export function setupCloudsyncIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('update-cloud-sync-config', async (_) => {
    await CloudSyncService.updateCloudSyncConfig(mainWindow)
  })

  ipcMain.handle('trigger-sync', async () => {
    await CloudSyncService.sync()
  })

  ipcMain.handle('get-backup-list', async () => {
    return await CloudSyncService.getBackupList()
  })

  // Restore Historical Versions
  ipcMain.handle('restore-history-version', async (_, filename: string) => {
    await CloudSyncService.restoreHistoryVersion(filename)
  })

  // Manually triggered backups
  ipcMain.handle('trigger-backup', async () => {
    await CloudSyncService.uploadBackup()
  })

  mainWindow.webContents.send('adderIPCReady')
}

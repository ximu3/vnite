import { ipcMain, BrowserWindow } from 'electron'
import { DBManager, backupDatabase, restoreDatabase, startSync, ConfigDBManager } from '~/database'
import { getCouchDbSize } from '~/utils'
import { DocChange } from '@appTypes/database'

export function setupDatabaseIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('db-changed', async (_event, change: DocChange) => {
    return await DBManager.setValue(change.dbName, change.docId, '#all', change.data)
  })

  ipcMain.handle('db-get-all-docs', async (_event, dbName: string) => {
    return await DBManager.getAllDocs(dbName)
  })

  ipcMain.handle('restart-sync', async (_) => {
    await startSync()
  })

  ipcMain.handle(
    'db-check-attachment',
    async (_event, dbName: string, docId: string, attachmentId: string) => {
      return await DBManager.checkAttachment(dbName, docId, attachmentId)
    }
  )

  ipcMain.handle('backup-database', async (_, targetPath: string) => {
    await backupDatabase(targetPath)
  })

  ipcMain.handle('restore-database', async (_, sourcePath: string) => {
    await restoreDatabase(sourcePath)
  })

  ipcMain.handle('get-couchdb-size', async () => {
    const username = await ConfigDBManager.getConfigLocalValue('sync.officialConfig.auth.username')
    return await getCouchDbSize(username)
  })

  mainWindow.webContents.send('databaseIPCReady')
}

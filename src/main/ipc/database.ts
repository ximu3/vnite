import { ipcMain, BrowserWindow } from 'electron'
import { DBManager } from '~/database'
import { DocChange } from '@appTypes/database'

export function setupDatabaseIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('db-changed', async (_event, change: DocChange) => {
    return await DBManager.setValue(change.dbName, change.docId, '#all', change.data)
  })

  ipcMain.handle('db-get-all-docs', async (_event, dbName: string) => {
    return await DBManager.getAllDocs(dbName)
  })

  ipcMain.handle(
    'db-check-attachment',
    async (_event, dbName: string, docId: string, attachmentId: string) => {
      return await DBManager.checkAttachment(dbName, docId, attachmentId)
    }
  )

  mainWindow.webContents.send('databaseIPCReady')
}

import { ipcMain, BrowserWindow } from 'electron'
import { DBManager } from '~/database'
import { DocChange } from '@appTypes/database'

export function setupDatabaseIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'db-get-value',
    async (_event, dbName: string, docId: string, path: string[], defaultValue: any) => {
      return await DBManager.getValue(dbName, docId, path, defaultValue)
    }
  )

  ipcMain.handle(
    'db-set-value',
    async (_event, dbName: string, docId: string, path: string[], value: any) => {
      return await DBManager.setValue(dbName, docId, path, value)
    }
  )

  ipcMain.handle('db-changed', async (_event, change: DocChange) => {
    return await DBManager.setValue(change.dbName, change.docId, ['#all'], change.data)
  })

  ipcMain.handle('db-get-all-docs', async (_event, dbName: string) => {
    return await DBManager.getAllDocs(dbName)
  })

  ipcMain.handle('db-set-all-docs', async (_event, dbName: string, docs: any[]) => {
    return await DBManager.setAllDocs(dbName, docs)
  })

  ipcMain.handle(
    'db-check-attachment',
    async (_event, dbName: string, docId: string, attachmentId: string) => {
      return await DBManager.checkAttachment(dbName, docId, attachmentId)
    }
  )

  mainWindow.webContents.send('databaseIPCReady')
}

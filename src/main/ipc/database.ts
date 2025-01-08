import { ipcMain, BrowserWindow } from 'electron'
import {
  setDBValue,
  getDBValue,
  getGameIndexData,
  getGamesRecordData,
  backupGameSaveData,
  restoreGameSaveData,
  deleteGameSaveData,
  deleteGameFromDB,
  backupDatabaseData,
  restoreDatabaseData
} from '~/database'

export function setupDatabaseIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'set-db-value',
    async (_, dbName: string, path: string[], value: any, noIpcAction?: boolean) => {
      await setDBValue(dbName, path, value, noIpcAction)
    }
  )

  ipcMain.handle('get-db-value', async (_, dbName: string, path: string[], defaultValue: any) => {
    return await getDBValue(dbName, path, defaultValue)
  })

  ipcMain.handle('get-games-index', () => {
    return getGameIndexData()
  })

  ipcMain.handle('backup-game-save', async (_, gameId: string) => {
    await backupGameSaveData(gameId)
  })

  ipcMain.handle('restore-game-save', async (_, gameId: string, saveId: string) => {
    await restoreGameSaveData(gameId, saveId)
  })

  ipcMain.handle('delete-game-save', async (_, gameId: string, saveId: string) => {
    await deleteGameSaveData(gameId, saveId)
  })

  ipcMain.handle('get-games-record-data', async () => {
    return await getGamesRecordData()
  })

  ipcMain.handle('delete-game-from-db', async (_, gameId: string) => {
    await deleteGameFromDB(gameId)
  })

  ipcMain.handle('backup-database', async (_, targetPath: string) => {
    await backupDatabaseData(targetPath)
  })

  ipcMain.handle('restore-database', async (_, sourcePath: string) => {
    await restoreDatabaseData(sourcePath)
  })

  ipcMain.on('reload-db-values', (_, dbName: string) => {
    mainWindow.webContents.send('reload-db-values', dbName)
  })

  mainWindow.webContents.send('databaseIPCReady')
}

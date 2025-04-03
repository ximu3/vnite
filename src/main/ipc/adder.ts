import { ipcMain, BrowserWindow } from 'electron'
import {
  addGameToDatabase,
  getBatchGameAdderDataFromDirectory,
  addGameToDatabaseWithoutMetadata,
  updateGameMetadata
} from '~/adder'

export function setupAdderIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'add-game-to-db',
    async (
      _,
      {
        dataSource,
        dataSourceId,
        backgroundUrl,
        dirPath
      }: {
        dataSource: string
        dataSourceId: string
        backgroundUrl?: string
        dirPath?: string
      }
    ) => {
      await addGameToDatabase({ dataSource, dataSourceId, backgroundUrl, dirPath })
    }
  )

  ipcMain.handle(
    'update-game-metadata',
    async (
      _,
      {
        dbId,
        dataSource,
        dataSourceId,
        backgroundUrl
      }: {
        dbId: string
        dataSource: string
        dataSourceId: string
        backgroundUrl?: string
      }
    ) => {
      await updateGameMetadata({ dbId, dataSource, dataSourceId, backgroundUrl })
    }
  )

  ipcMain.handle('get-batch-game-adder-data', async () => {
    return await getBatchGameAdderDataFromDirectory()
  })

  ipcMain.handle('add-game-to-db-without-metadata', async (_, gamePath: string) => {
    await addGameToDatabaseWithoutMetadata(gamePath)
  })

  mainWindow.webContents.send('adderIPCReady')
}

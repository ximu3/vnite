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
        id,
        screenshotUrl
      }: {
        dataSource: string
        id: string
        screenshotUrl?: string
      }
    ) => {
      await addGameToDatabase({ dataSource, id, screenshotUrl })
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
        screenshotUrl
      }: {
        dbId: string
        dataSource: string
        dataSourceId: string
        screenshotUrl?: string
      }
    ) => {
      await updateGameMetadata({ dbId, dataSource, dataSourceId, screenshotUrl })
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

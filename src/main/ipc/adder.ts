import { ipcMain, BrowserWindow } from 'electron'
import {
  addGameToDatabase,
  getBatchGameAdderDataFromDirectory,
  addGameToDatabaseWithoutMetadata
} from '~/adder'

export function setupAdderIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'add-game-to-db',
    async (
      _,
      {
        dataSource,
        id,
        dbId,
        screenshotUrl
      }: {
        dataSource: string
        id: string
        dbId?: string
        screenshotUrl?: string
      }
    ) => {
      await addGameToDatabase({ dataSource, id, dbId, screenshotUrl })
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

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
        preExistingDbId,
        screenshotUrl
      }: {
        dataSource: string
        id: string
        preExistingDbId?: string
        screenshotUrl?: string
      }
    ) => {
      await addGameToDatabase({ dataSource, id, preExistingDbId, screenshotUrl })
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

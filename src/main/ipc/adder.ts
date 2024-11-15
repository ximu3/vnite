import { ipcMain, BrowserWindow } from 'electron'
import { addGameToDatabase, getBatchGameAdderDataFromDirectory } from '~/adder'

export function setupAdderIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'add-game-to-db',
    async (_, dataSource: string, id: string, dbId?: string, screenshotUrl?: string) => {
      await addGameToDatabase(dataSource, id, dbId || '', screenshotUrl)
    }
  )

  ipcMain.handle('get-batch-game-adder-data', async () => {
    return await getBatchGameAdderDataFromDirectory()
  })

  mainWindow.webContents.send('adderIPCReady')
}

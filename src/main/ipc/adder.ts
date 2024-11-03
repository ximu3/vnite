import { ipcMain, BrowserWindow } from 'electron'
import { addGameToDB } from '~/adder/common'

export function setupAdderIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'add-game-to-db',
    async (_, dataSource: string, id: string, screenshotUrl: string) => {
      await addGameToDB(dataSource, id, screenshotUrl)
    }
  )

  mainWindow.webContents.send('adderIPCReady')
}

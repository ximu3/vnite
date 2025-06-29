import { cropImage, saveGameIconByFile, downloadTempImage } from '~/media'
import { ipcMain, BrowserWindow } from 'electron'

export function setupMediaIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'crop-image',
    async (
      _,
      {
        sourcePath,
        x,
        y,
        width,
        height
      }: {
        sourcePath: string
        x: number
        y: number
        width: number
        height: number
      }
    ) => {
      return await cropImage({ sourcePath, x, y, width, height })
    }
  )

  ipcMain.handle('save-game-icon-by-file', async (_, gameId: string, filePath: string, shouldCompress: boolean, compressFactor?: number) => {
    return await saveGameIconByFile(gameId, filePath, shouldCompress, compressFactor)
  })

  ipcMain.handle('download-temp-image', async (_, url: string) => {
    return await downloadTempImage(url)
  })

  mainWindow.webContents.send('mediaIPCReady')
}

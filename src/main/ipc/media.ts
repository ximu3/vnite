import {
  getMedia,
  setMedia,
  saveIcon,
  checkIcon,
  downloadImage,
  saveImage,
  getImage
} from '~/media'
import { ipcMain, BrowserWindow } from 'electron'

export function setupMediaIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'get-game-media-path',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon') => {
      return getMedia(gameId, type)
    }
  )

  ipcMain.handle(
    'set-game-media',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon', source: string) => {
      return await setMedia(gameId, type, source)
    }
  )

  ipcMain.handle('save-game-icon', async (_, gameId: string, filePath: string) => {
    return await saveIcon(gameId, filePath)
  })

  ipcMain.handle('check-game-icon', async (_, gameId: string) => {
    return await checkIcon(gameId)
  })

  ipcMain.handle('download-temp-image', async (_, url: string) => {
    return await downloadImage(url)
  })

  ipcMain.handle('save-temp-image', async (_, blobBuffer: Uint8Array) => {
    return await saveImage(blobBuffer)
  })

  ipcMain.handle('get-image-blob', async (_, filePath: string) => {
    return await getImage(filePath)
  })

  mainWindow.webContents.send('mediaIPCReady')
}

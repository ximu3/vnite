import { getMedia } from '~/media'
import { ipcMain, BrowserWindow } from 'electron'

export function setupMediaIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'get-game-media-path',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon') => {
      return getMedia(gameId, type)
    }
  )
  mainWindow.webContents.send('mediaIPCReady')
}

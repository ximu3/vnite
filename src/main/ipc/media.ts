import { getMedia, setMedia } from '~/media'
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

  mainWindow.webContents.send('mediaIPCReady')
}

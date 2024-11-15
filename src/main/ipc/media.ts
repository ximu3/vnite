import { getMedia, setMedia, saveIcon, checkIcon } from '~/media'
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

  mainWindow.webContents.send('mediaIPCReady')
}

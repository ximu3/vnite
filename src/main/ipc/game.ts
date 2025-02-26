import { GameDBManager } from '~/database'
import { ipcMain, BrowserWindow } from 'electron'

export function setupGameIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'set-game-image',
    async (_, gameId: string, type: 'background' | 'cover' | 'logo' | 'icon', image: string) => {
      return await GameDBManager.setGameImage(gameId, type, image)
    }
  )

  mainWindow.webContents.send('gameIPCReady')
}

import { GameDBManager, deleteGameSave } from '~/database'
import { ipcMain, BrowserWindow } from 'electron'

export function setupGameIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'set-game-image',
    async (_, gameId: string, type: 'background' | 'cover' | 'logo' | 'icon', image: string) => {
      return await GameDBManager.setGameImage(gameId, type, image)
    }
  )

  ipcMain.handle('delete-game-save', async (_, gameId: string, saveId: string) => {
    await deleteGameSave(gameId, saveId)
  })

  ipcMain.handle('delete-game', async (_, gameId: string) => {
    await GameDBManager.removeGame(gameId)
  })

  mainWindow.webContents.send('gameIPCReady')
}

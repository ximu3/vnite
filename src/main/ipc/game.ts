import {
  GameDBManager,
  deleteGameSave,
  restoreGameSave,
  addMemory,
  deleteMemory,
  updateMemoryCover
} from '~/database'
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

  ipcMain.handle('restore-game-save', async (_, gameId: string, saveId: string) => {
    await restoreGameSave(gameId, saveId)
  })

  ipcMain.handle('delete-game', async (_, gameId: string) => {
    await GameDBManager.removeGame(gameId)
  })

  ipcMain.handle('add-memory', async (_, gameId: string) => {
    await addMemory(gameId)
  })

  ipcMain.handle('delete-memory', async (_, gameId: string, memoryId: string) => {
    await deleteMemory(gameId, memoryId)
  })

  ipcMain.handle(
    'update-memory-cover',
    async (_, gameId: string, memoryId: string, imgPath: string) => {
      await updateMemoryCover(gameId, memoryId, imgPath)
    }
  )

  ipcMain.handle('get-memory-cover-path', async (_, gameId: string, memoryId: string) => {
    return await GameDBManager.getGameMemoryImage(gameId, memoryId, 'file')
  })

  ipcMain.handle(
    'get-game-media-path',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon' | 'logo') => {
      return await GameDBManager.getGameImage(gameId, type, 'file')
    }
  )

  ipcMain.handle(
    'remove-game-media',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon' | 'logo') => {
      return await GameDBManager.removeGameImage(gameId, type)
    }
  )

  ipcMain.handle('check-game-exits-by-path', async (_, gamePath: string) => {
    return await GameDBManager.checkGameExitsByPath(gamePath)
  })

  mainWindow.webContents.send('gameIPCReady')
}

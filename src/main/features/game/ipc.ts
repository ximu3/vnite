import { GameDBManager } from '~/core/database'
import { ipcManager } from '~/core/ipc'
import {
  addGameMemory,
  deleteGameMemory,
  deleteGameSave,
  restoreGameSave,
  searchGameSavePaths,
  updateGameMemoryCover
} from './services'

export function setupGameIPC(): void {
  ipcManager.handle(
    'game:set-image',
    async (_, gameId: string, type: 'background' | 'cover' | 'logo' | 'icon', image: string) => {
      return await GameDBManager.setGameImage(gameId, type, image)
    }
  )

  ipcManager.handle('game:search-save-paths', async (_, gameId: string) => {
    return await searchGameSavePaths(gameId)
  })

  ipcManager.handle('game:delete-save', async (_, gameId: string, saveId: string) => {
    await deleteGameSave(gameId, saveId)
  })

  ipcManager.handle('game:restore-save', async (_, gameId: string, saveId: string) => {
    await restoreGameSave(gameId, saveId)
  })

  ipcManager.handle('game:delete', async (_, gameId: string) => {
    await GameDBManager.removeGame(gameId)
  })

  ipcManager.handle('game:add-memory', async (_, gameId: string) => {
    await addGameMemory(gameId)
  })

  ipcManager.handle('game:delete-memory', async (_, gameId: string, memoryId: string) => {
    await deleteGameMemory(gameId, memoryId)
  })

  ipcManager.handle(
    'game:update-memory-cover',
    async (_, gameId: string, memoryId: string, imgPath: string) => {
      await updateGameMemoryCover(gameId, memoryId, imgPath)
    }
  )

  ipcManager.handle('game:get-memory-cover-path', async (_, gameId: string, memoryId: string) => {
    return await GameDBManager.getGameMemoryImage(gameId, memoryId, 'file')
  })

  ipcManager.handle(
    'game:get-media-path',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon' | 'logo') => {
      return await GameDBManager.getGameImage(gameId, type, 'file')
    }
  )

  ipcManager.handle(
    'game:remove-media',
    async (_, gameId: string, type: 'cover' | 'background' | 'icon' | 'logo') => {
      return await GameDBManager.removeGameImage(gameId, type)
    }
  )

  ipcManager.handle('game:check-exits-by-path', async (_, gamePath: string) => {
    return await GameDBManager.checkGameExitsByPath(gamePath)
  })
}

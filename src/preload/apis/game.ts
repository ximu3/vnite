import { ipcRenderer } from 'electron'

export const gameAPI = {
  async setGameImage(
    gameId: string,
    type: 'background' | 'cover' | 'logo' | 'icon',
    image: string
  ): Promise<void> {
    return await ipcRenderer.invoke('set-game-image', gameId, type, image)
  },

  async deleteGameSave(gameId: string, saveId: string): Promise<void> {
    return await ipcRenderer.invoke('delete-game-save', gameId, saveId)
  },

  async restoreGameSave(gameId: string, saveId: string): Promise<void> {
    return await ipcRenderer.invoke('restore-game-save', gameId, saveId)
  },

  async deleteGame(gameId: string): Promise<void> {
    return await ipcRenderer.invoke('delete-game', gameId)
  },

  async addMemory(gameId: string): Promise<void> {
    return await ipcRenderer.invoke('add-memory', gameId)
  },

  async deleteMemory(gameId: string, memoryId: string): Promise<void> {
    return await ipcRenderer.invoke('delete-memory', gameId, memoryId)
  },

  async updateMemoryCover(gameId: string, memoryId: string, imgPath: string): Promise<void> {
    return await ipcRenderer.invoke('update-memory-cover', gameId, memoryId, imgPath)
  },

  async getMemoryCoverPath(gameId: string, memoryId: string): Promise<string> {
    return await ipcRenderer.invoke('get-memory-cover-path', gameId, memoryId)
  },

  async getGameMediaPath(
    gameId: string,
    type: 'cover' | 'background' | 'icon' | 'logo'
  ): Promise<string> {
    return await ipcRenderer.invoke('get-game-media-path', gameId, type)
  },

  async removeGameMedia(
    gameId: string,
    type: 'cover' | 'background' | 'icon' | 'logo'
  ): Promise<void> {
    return await ipcRenderer.invoke('remove-game-media', gameId, type)
  },

  async checkGameExitsByPath(gamePath: string): Promise<boolean> {
    return await ipcRenderer.invoke('check-game-exits-by-path', gamePath)
  }
}

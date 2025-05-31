import { ipcRenderer } from 'electron'

export const launcherAPI = {
  async launcherPreset(presetName: string, gameId: string, steamId?: string): Promise<void> {
    return await ipcRenderer.invoke('launcher-preset', presetName, gameId, steamId)
  },

  startGame(gameId: string): void {
    ipcRenderer.send('start-game', gameId)
  },

  async stopGame(gameId: string): Promise<void> {
    return await ipcRenderer.invoke(`stop-game-${gameId}`)
  }
}

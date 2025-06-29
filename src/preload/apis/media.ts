import { ipcRenderer } from 'electron'

export const mediaAPI = {
  async cropImage(params: {
    sourcePath: string
    x: number
    y: number
    width: number
    height: number
  }): Promise<string> {
    return await ipcRenderer.invoke('crop-image', params)
  },

  async saveGameIconByFile(gameId: string, filePath: string, shouldCompress: boolean, compressFactor?: number): Promise<void> {
    return await ipcRenderer.invoke('save-game-icon-by-file', gameId, filePath, shouldCompress, compressFactor)
  },

  async downloadTempImage(url: string): Promise<string> {
    return await ipcRenderer.invoke('download-temp-image', url)
  }
}

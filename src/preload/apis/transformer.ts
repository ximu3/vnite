import { ipcRenderer } from 'electron'
import type { GameMetadata } from '../../types/utils'

export const transformerAPI = {
  async transformMetadata(metadata: GameMetadata, transformerIds: string[]): Promise<GameMetadata> {
    return await ipcRenderer.invoke('transform-metadata', metadata, transformerIds)
  },

  async exportTransformer(transformer: any, targetPath: string): Promise<void> {
    return await ipcRenderer.invoke('export-transformer', transformer, targetPath)
  },

  async importTransformer(sourcePath: string): Promise<any> {
    return await ipcRenderer.invoke('import-transformer', sourcePath)
  },

  async transformGameById(gameId: string, transformerIds: string[]): Promise<any> {
    return await ipcRenderer.invoke('transform-game-by-id', gameId, transformerIds)
  },

  async transformAllGames(transformerIds: string[]): Promise<any> {
    return await ipcRenderer.invoke('transform-all-games', transformerIds)
  },

  async applyMetadata(gameId: string, metadata: GameMetadata): Promise<void> {
    return await ipcRenderer.invoke('apply-metadata', gameId, metadata)
  }
}

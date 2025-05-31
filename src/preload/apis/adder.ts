import { ipcRenderer } from 'electron'
import { BatchGameInfo } from '@appTypes/database'

export const adderAPI = {
  async addGameToDb(params: {
    dataSource: string
    dataSourceId: string
    backgroundUrl?: string
    dirPath?: string
  }): Promise<void> {
    return await ipcRenderer.invoke('add-game-to-db', params)
  },

  async updateGameMetadata(params: {
    dbId: string
    dataSource: string
    dataSourceId: string
    backgroundUrl?: string
  }): Promise<void> {
    return await ipcRenderer.invoke('update-game-metadata', params)
  },

  async getBatchGameAdderData(): Promise<BatchGameInfo[]> {
    return await ipcRenderer.invoke('get-batch-game-adder-data')
  },

  async addGameToDbWithoutMetadata(gamePath: string): Promise<void> {
    return await ipcRenderer.invoke('add-game-to-db-without-metadata', gamePath)
  }
}

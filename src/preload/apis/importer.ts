import { ipcRenderer } from 'electron'
import { FormattedGameInfo } from '~/importer/steam/types'

export const importerAPI = {
  async importV2Data(dataPath: string): Promise<any> {
    return await ipcRenderer.invoke('import-v2-data', dataPath)
  },

  async getSteamGames(steamId: string): Promise<FormattedGameInfo[]> {
    return await ipcRenderer.invoke('get-steam-games', steamId)
  },

  async importSelectedSteamGames(games: FormattedGameInfo[]): Promise<any> {
    return await ipcRenderer.invoke('import-selected-steam-games', games)
  }
}

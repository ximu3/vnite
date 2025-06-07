import { ipcRenderer } from 'electron'
import { FormattedGameInfo } from '../../main/importer/steam/types'

export const importerAPI = {
  async importV2Data(dataPath: string): Promise<void> {
    return await ipcRenderer.invoke('import-v2-data', dataPath)
  },

  async getSteamGames(steamId: string): Promise<FormattedGameInfo[]> {
    return await ipcRenderer.invoke('get-steam-games', steamId)
  },

  async importSelectedSteamGames(games: FormattedGameInfo[]): Promise<number> {
    return await ipcRenderer.invoke('import-selected-steam-games', games)
  }
}

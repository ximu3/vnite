import { importV2DataToV3 } from './services/versionConverter'
import { getSteamGames, importSteamGames } from './services/steam'
import { SteamFormattedGameInfo } from '@appTypes/utils'
import { ipcManager } from '~/core/ipc'

export function setupImporterIPC(): void {
  ipcManager.handle('importer:import-v2-data', async (_, dataPath: string) => {
    return await importV2DataToV3(dataPath)
  })

  ipcManager.handle('importer:get-steam-games', async (_event, steamId: string) => {
    return await getSteamGames(steamId)
  })

  ipcManager.handle(
    'importer:import-selected-steam-games',
    async (_event, games: SteamFormattedGameInfo[]) => {
      return await importSteamGames(games)
    }
  )
}

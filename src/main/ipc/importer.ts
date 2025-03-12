import { importV2DataToV3 } from '~/importer/versionConverter'
import { getSteamGames, importSteamGames } from '~/importer/steam'
import { FormattedGameInfo } from '~/importer/steam/types'
import { ipcMain, BrowserWindow } from 'electron'

export function setupImporterIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('import-v2-data', async (_, dataPath: string) => {
    return await importV2DataToV3(dataPath)
  })

  ipcMain.handle('get-steam-games', async (_event, steamId: string) => {
    return await getSteamGames(steamId)
  })

  ipcMain.handle('import-selected-steam-games', async (_event, games: FormattedGameInfo[]) => {
    return await importSteamGames(games)
  })

  mainWindow.webContents.send('importerIPCReady')
}

import { importV1DataToV2 } from '~/importer/versionConverter'
import { importUserSteamGamesToDB } from '~/importer/steam'
import { ipcMain, BrowserWindow } from 'electron'

export function setupImporterIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('import-v1-data', async (_, dataPath: string) => {
    return await importV1DataToV2(dataPath)
  })

  ipcMain.handle('import-user-steam-games', async (_, steamId: string) => {
    return await importUserSteamGamesToDB(steamId)
  })

  mainWindow.webContents.send('importerIPCReady')
}

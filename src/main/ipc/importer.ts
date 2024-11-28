import { importV1DataToV2 } from '~/importer'
import { ipcMain, BrowserWindow } from 'electron'

export function setupImporterIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('import-v1-data', async (_, dataPath: string) => {
    return await importV1DataToV2(dataPath)
  })

  mainWindow.webContents.send('importerIPCReady')
}

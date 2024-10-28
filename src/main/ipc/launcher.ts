import { ipcMain, BrowserWindow } from 'electron'
import { launcherPreset } from '~/launcher'

export function setupLauncherIPC(mainWindow: BrowserWindow): void {
  ipcMain.on('launcher-preset', async (_, presetName: string, gameId: string) => {
    await launcherPreset(presetName, gameId)
  })

  mainWindow.webContents.send('launcherIPCReady')
}

import { ipcMain, BrowserWindow } from 'electron'
import { launcherPreset, launcher } from '~/launcher'

export function setupLauncherIPC(mainWindow: BrowserWindow): void {
  ipcMain.on('launcher-preset', async (_, presetName: string, gameId: string, steamId?: string) => {
    await launcherPreset(presetName, gameId, steamId)
  })

  ipcMain.on('start-game', async (_, gameId: string) => {
    await launcher(gameId)
  })

  mainWindow.webContents.send('launcherIPCReady')
}

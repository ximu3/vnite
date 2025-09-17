import { ipcMain } from 'electron'
import { ConfigDBManager } from '~/core/database'
import { AutoMonitor } from './services/auto'
import { ActiveGameInfo } from '~/features/game'

export function setupMonitorIPC(): void {
  ipcMain.handle('monitor:get-auto-start', async () => {
    return await ConfigDBManager.getConfigValue('monitor.autoStart')
  })

  ipcMain.handle('monitor:set-auto-start', async (_event, enabled: boolean) => {
    await ConfigDBManager.setConfigValue('monitor.autoStart', enabled)
    if (enabled) {
      AutoMonitor.start()
    } else {
      AutoMonitor.stop()
    }
  })

  // Provide currently active games to seed renderer state on startup
  ipcMain.handle('monitor:get-active-games', async () => {
    return ActiveGameInfo.infos.map((info) => info.gameId)
  })
}

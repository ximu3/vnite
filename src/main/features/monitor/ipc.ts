import { ipcManager } from '~/core/ipc'
import * as native from 'vnite-native'
import { updateKnownGames } from './services/nativeMonitor'
import { ConfigDBManager } from '~/core/database'

export function setupNativeMonitorIPC(): void {
  ipcManager.on('native-monitor:add-local-game', async (_, gameId: string, monitorPath: string) => {
    const mode = await ConfigDBManager.getConfigValue('general.processMonitor')
    if (mode === 'new') {
      await native.addKnownGame(monitorPath, gameId)
    }
  })

  ipcManager.on('native-monitor:remove-local-game', async (_, monitorPath: string) => {
    const mode = await ConfigDBManager.getConfigValue('general.processMonitor')
    if (mode === 'new') {
      await native.removeKnownGame(monitorPath)
    }
  })

  ipcManager.on('native-monitor:update-local-game', async (_) => {
    const mode = await ConfigDBManager.getConfigValue('general.processMonitor')
    if (mode === 'new') {
      setTimeout(async () => {
        await updateKnownGames()
      }, 500)
    }
  })
}

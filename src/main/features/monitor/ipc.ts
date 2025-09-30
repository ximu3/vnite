import { ipcManager } from '~/core/ipc'
import * as native from 'vnite-native'
import { updateKnownGames } from './services/nativeMonitor'

export function setupNativeMonitorIPC(): void {
  ipcManager.on('native-monitor:add-local-game', async (_, gameId: string, monitorPath: string) => {
    await native.addKnownGame(monitorPath, gameId)
  })

  ipcManager.on('native-monitor:remove-local-game', async (_, monitorPath: string) => {
    await native.removeKnownGame(monitorPath)
  })

  ipcManager.on('native-monitor:update-local-game', async (_) => {
    setTimeout(async () => {
      await updateKnownGames()
    }, 500)
  })
}

import { ipcManager } from '~/core/ipc'
import { updateKnownGames } from './services/nativeMonitor'
import { ConfigDBManager } from '~/core/database'

export function setupNativeMonitorIPC(): void {
  ipcManager.on('native-monitor:update-local-game', async (_) => {
    const mode = await ConfigDBManager.getConfigValue('general.processMonitor')
    if (mode === 'new') {
      setTimeout(async () => {
        await updateKnownGames()
      }, 500)
    }
  })
}

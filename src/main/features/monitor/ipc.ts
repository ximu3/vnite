import { ipcManager } from '~/core/ipc'
import { updateKnownGames } from './services/nativeMonitor'

export function setupNativeMonitorIPC(): void {
  ipcManager.on('native-monitor:update-local-game', async (_) => {
    setTimeout(async () => {
      await updateKnownGames()
    }, 500)
  })
}

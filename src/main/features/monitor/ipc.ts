import { ipcManager } from '~/core/ipc'
import log from 'electron-log/main'
import { updateKnownGame } from './services/nativeMonitor'

const pendingLocalGameUpdates: Record<string, ReturnType<typeof setTimeout> | undefined> = {}

export function setupNativeMonitorIPC(): void {
  ipcManager.on('native-monitor:update-local-game', (_, gameId: string) => {
    const pendingTimer = pendingLocalGameUpdates[gameId]
    if (pendingTimer) {
      clearTimeout(pendingTimer)
    }

    const timer = setTimeout(() => {
      delete pendingLocalGameUpdates[gameId]
      void updateKnownGame(gameId).catch((error) => {
        log.error(`[Monitor] Failed to update known local game ${gameId}`, error)
      })
    }, 500)

    pendingLocalGameUpdates[gameId] = timer
  })
}

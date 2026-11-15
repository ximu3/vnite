import { ipcManager } from '~/core/ipc'
import { getMonitorStatus } from './services/connection'

export function setupProcessMonitorIPC(): void {
  ipcManager.handle('monitor:get-status', () => getMonitorStatus())
}

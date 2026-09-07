import { launcherPreset, launcher } from './services'
import { ipcManager } from '~/core/ipc'

export function setupLauncherIPC(): void {
  ipcManager.handle('launcher:select-preset', async (_, presetId: string, gameId: string) => {
    return await launcherPreset(presetId, gameId)
  })

  ipcManager.on('launcher:start-game', async (_, gameId: string) => {
    await launcher(gameId)
  })
}

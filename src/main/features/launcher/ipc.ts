import { launcherPreset, launcher } from './services'
import { ipcManager } from '~/core/ipc'

export function setupLauncherIPC(): void {
  ipcManager.handle(
    'launcher:select-preset',
    async (_, presetName: string, gameId: string, steamId?: string) => {
      await launcherPreset(presetName, gameId, steamId)
    }
  )

  ipcManager.on('launcher:start-game', async (_, gameId: string) => {
    await launcher(gameId)
  })
}

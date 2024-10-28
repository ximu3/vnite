import { defaultPreset } from './preset'
import log from 'electron-log/main.js'

export async function launcherPreset(presetName: string, gameId: string): Promise<void> {
  try {
    if (presetName === 'default') {
      await defaultPreset(gameId)
    }
  } catch (error) {
    log.error(`Failed to set preset for ${gameId}`, error)
  }
}

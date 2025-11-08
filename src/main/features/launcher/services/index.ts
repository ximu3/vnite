import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { delay } from '~/utils'
import { fileLauncher, scriptLauncher, urlLauncher } from './launcher'
import { defaultPreset, lePreset, steamPreset, vbaPreset } from './preset'
import { eventBus } from '~/core/events'
import { ipcManager } from '~/core/ipc'

export async function launcherPreset(
  presetName: string,
  gameId: string,
  steamId?: string
): Promise<void> {
  try {
    if (presetName === 'default') {
      await defaultPreset(gameId)
    } else if (presetName === 'le') {
      await lePreset(gameId)
    } else if (presetName === 'steam') {
      if (!steamId) {
        throw new Error('Steam ID is required for steam preset')
      }
      await steamPreset(gameId, steamId)
    } else if (presetName === 'vba') {
      await vbaPreset(gameId)
    }
  } catch (error) {
    log.error(`[Launcher] Failed to set preset for ${gameId}`, error)
    throw error
  }
}

export async function launcher(gameId: string): Promise<void> {
  try {
    const mode = await GameDBManager.getGameLocalValue(gameId, 'launcher.mode')
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const hideWindowAfterGameStart = await ConfigDBManager.getConfigValue(
      'general.hideWindowAfterGameStart'
    )
    if (hideWindowAfterGameStart && mainWindow) {
      await delay(1000) // Delay to improve user experience
      mainWindow.hide()
    }
    if (mode === 'file') {
      await fileLauncher(gameId)
    } else if (mode === 'url') {
      await urlLauncher(gameId)
    } else if (mode === 'script') {
      await scriptLauncher(gameId)
    }
    // Emit event after launching the game
    eventBus.emit(
      'game:launched',
      {
        gameId,
        launchMode: mode,
        launchConfig: await GameDBManager.getGameLocalValue(gameId, `launcher.${mode}Config`)
      },
      { source: 'launcher' }
    )
    log.info(`[Launcher] Launched game ${gameId}`)
  } catch (error) {
    ipcManager.send('game:launch-failed', gameId)
    log.error(`[Launcher] Failed to launch game ${gameId}`, error)
  }
}

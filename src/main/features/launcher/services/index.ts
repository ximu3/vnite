import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { delay } from '~/utils'
import { fileLauncher, scriptLauncher, urlLauncher } from './launcher'
import { defaultPreset, lePreset, steamPreset, vbaPreset } from './preset'
import { eventBus } from '~/core/events'

/**
 * Set the preset for the launcher
 * @param presetName - The name of the preset
 * @param gameId - The id of the game
 * @param steamId - The steam id of the game
 * @returns A promise that resolves when the operation is complete.
 */
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
    log.error(`Failed to set preset for ${gameId}`, error)
    throw error
  }
}

/**
 * Launch the game
 * @param gameId - The id of the game
 * @returns A promise that resolves when the operation is complete.
 */
export async function launcher(gameId: string): Promise<void> {
  try {
    const mode = await GameDBManager.getGameLocalValue(gameId, 'launcher.mode')
    const mainWindow = BrowserWindow.getAllWindows()[0]
    const hideWindowAfterGameStart = await ConfigDBManager.getConfigValue(
      'general.hideWindowAfterGameStart'
    )
    if (hideWindowAfterGameStart && mainWindow) {
      await delay(1000)
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
    log.info(`Launched game ${gameId}`)
  } catch (error) {
    log.error(`Failed to launch game ${gameId}`, error)
  }
}

import { GameDBManager, ConfigDBManager } from '~/core/database'
import { createUrlShortcut, getAppTempPath, convertToIcon } from '~/utils'
import log from 'electron-log/main'
import { app } from 'electron'

/**
 * Get the path to the application log file
 * @returns The path to the application log file
 */
export async function setupOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('Error toggling open at login:', error)
  }
}

/**
 * Open a path in the file explorer
 * @param filePath The path to open
 */
export async function updateOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('Error setting open at login:', error)
  }
}

export async function saveGameIconByFile(gameId: string, filePath: string): Promise<void> {
  try {
    // Get file icon
    const icon = await app.getFileIcon(filePath)

    // Save icon
    await GameDBManager.setGameImage(gameId, 'icon', icon.toPNG())

    console.log('Save Icon Successful:', filePath)
  } catch (error) {
    console.error('Failed to save icon:', error)
    throw error
  }
}

/**
 * Create a shortcut for a game
 * @param gameId The ID of the game
 * @param targetPath The path to save the shortcut
 */
export async function createGameShortcut(gameId: string, targetPath: string): Promise<void> {
  try {
    // Get game information
    const gameName = await GameDBManager.getGameValue(gameId, 'metadata.name')

    const originalIconPath = await GameDBManager.getGameImage(gameId, 'icon', 'file')

    // ico icon path
    const iconPath = getAppTempPath(`icon_${gameId}_${Date.now()}.ico`)

    // Convert icons to ico format
    if (originalIconPath) {
      await convertToIcon(originalIconPath, iconPath, {
        sizes: [32],
        quality: 100
      })
    }
    // Creating URL shortcuts
    await createUrlShortcut({
      url: `vnite://rungameid/${gameId}`,
      iconPath: iconPath,
      targetPath: targetPath,
      name: gameName,
      description: `Launch ${gameName} in Vnite`,
      categories: ['Game']
    })
  } catch (error) {
    log.error('Error creating game shortcut:', error)
  }
}

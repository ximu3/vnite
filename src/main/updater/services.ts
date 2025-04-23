import { setupAutoUpdater } from './common'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'

/**
 * Set up the auto updater
 * @param mainWindow The main window
 */
export async function setupUpdater(mainWindow: BrowserWindow): Promise<void> {
  try {
    await setupAutoUpdater(mainWindow)
  } catch (error) {
    log.error('Failed to setup updater:', error)
  }
}

// /**
//  * Upgrade the database version
//  */
// export async function upgradeDB(): Promise<void> {
//   try {
//     await upgradeDBVersion()
//   } catch (error) {
//     log.error('Failed to upgrade database:', error)
//   }
// }

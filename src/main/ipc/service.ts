import { setupDatabaseIPC } from './database'
import { setupUtilsIPC } from './utils'
import { setupLauncherIPC } from './launcher'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'

export function setupIPC(mainWindow: BrowserWindow): void {
  try {
    setupUtilsIPC(mainWindow)
    setupDatabaseIPC(mainWindow)
    setupLauncherIPC(mainWindow)
  } catch (error) {
    log.error('Failed to set up IPC', error)
  }
}

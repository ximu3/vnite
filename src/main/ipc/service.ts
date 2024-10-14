import { setupDatabaseIPC } from './databaseIPC'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'

export function setupIPC(mainWindow: BrowserWindow): void {
  try {
    setupDatabaseIPC(mainWindow)
  } catch (error) {
    log.error('Failed to set up IPC', error)
  }
}

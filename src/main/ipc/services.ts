import { setupDatabaseIPC } from './database'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'

export function setupIPC(mainWindow: BrowserWindow): void {
  try {
    setupDatabaseIPC(mainWindow)
  } catch (error) {
    log.error('Error setting up IPC:', error)
    throw error
  }
}

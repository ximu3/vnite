import { setupAutoUpdater } from './common'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main.js'

export function setupUpdater(mainWindow: BrowserWindow): void {
  try {
    setupAutoUpdater(mainWindow)
  } catch (error) {
    log.error('Failed to setup updater:', error)
  }
}

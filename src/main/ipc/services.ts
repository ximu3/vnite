import { setupDatabaseIPC } from './database'
import { setupGameIPC } from './game'
import { setupUtilsIPC } from './utils'
import { setupLauncherIPC } from './launcher'
import { setupScraperIPC } from './scraper'
import { setupAdderIPC } from './adder'
import { setupMediaIPC } from './media'
import { setupImporterIPC } from './importer'
import { setupThemeIPC } from './theme'
import { setupUpdaterIPC } from './updater'
import { setupAccountIPC } from './account'
import { setupTransformerIPC } from './transformer'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'

export function setupIPC(mainWindow: BrowserWindow): void {
  try {
    setupDatabaseIPC(mainWindow)
    setupGameIPC(mainWindow)
    setupUtilsIPC(mainWindow)
    setupLauncherIPC(mainWindow)
    setupScraperIPC(mainWindow)
    setupAdderIPC(mainWindow)
    setupMediaIPC(mainWindow)
    setupImporterIPC(mainWindow)
    setupThemeIPC(mainWindow)
    setupUpdaterIPC(mainWindow)
    setupAccountIPC(mainWindow)
    setupTransformerIPC(mainWindow)
  } catch (error) {
    log.error('Error setting up IPC:', error)
    throw error
  }
}

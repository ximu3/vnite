import { BrowserWindow } from 'electron'
import { setupDBWatcher, stopWatchers } from './setup'
import log from 'electron-log/main.js'

const imageFileExtensions = ['jpg', 'jpeg', 'png', 'webp']

const imageFileNames = ['cover', 'background', 'icon']

const imageFullNames = imageFileNames
  .map((name) => imageFileExtensions.map((ext) => `${name}.${ext}`))
  .flat()

/**
 * Set up the watcher
 * @param mainWindow The main window
 * @returns A promise that resolves when the operation is complete.
 */
export async function setupWatcher(mainWindow: BrowserWindow): Promise<void> {
  try {
    await setupDBWatcher([...imageFullNames], mainWindow)
  } catch (error) {
    log.error('Failed to set up watcher', error)
  }
}

/**
 * Stop the watcher
 */
export function stopWatcher(): void {
  try {
    stopWatchers()
  } catch (error) {
    log.error('Failed to stop watcher', error)
  }
}

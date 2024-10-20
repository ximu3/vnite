import { BrowserWindow } from 'electron'
import { setupDBWatcher, stopWatchers } from './setup'
import log from 'electron-log/main.js'

export async function setupWatcher(mainWindow: BrowserWindow): Promise<void> {
  try {
    await setupDBWatcher(['metadata.json', 'collections.json'], mainWindow)
  } catch (error) {
    log.error('Failed to set up watcher', error)
  }
}

export function stopWatcher(): void {
  try {
    stopWatchers()
  } catch (error) {
    log.error('Failed to stop watcher', error)
  }
}

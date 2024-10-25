import { BrowserWindow } from 'electron'
import { setupDBWatcher, stopWatchers } from './setup'
import log from 'electron-log/main.js'
import { Watcher } from './common'
import { getDataPath } from '~/utils'

let indexWatcher: Watcher

export async function setupWatcher(mainWindow: BrowserWindow): Promise<void> {
  try {
    await setupDBWatcher(['metadata.json', 'collections.json'], mainWindow)
    await setupDBWatcher(['record.json'], mainWindow, () =>
      mainWindow.webContents.send('timer-update')
    )
    indexWatcher = new Watcher('games', await getDataPath('games'), mainWindow, () =>
      mainWindow.webContents.send('rebuild-index')
    )
    indexWatcher.start()
  } catch (error) {
    log.error('Failed to set up watcher', error)
  }
}

export function stopWatcher(): void {
  try {
    stopWatchers()
    indexWatcher.stop()
  } catch (error) {
    log.error('Failed to stop watcher', error)
  }
}

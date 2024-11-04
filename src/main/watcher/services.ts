import { BrowserWindow } from 'electron'
import { setupDBWatcher, stopWatchers } from './setup'
import log from 'electron-log/main.js'
import { Watcher } from './common'
import { getDataPath } from '~/utils'

let indexWatcher: Watcher

const imageFileExtensions = ['jpg', 'jpeg', 'png', 'webp']

const imageFileNames = ['cover', 'background', 'icon']

const imageFullNames = imageFileNames
  .map((name) => imageFileExtensions.map((ext) => `${name}.${ext}`))
  .flat()

export async function setupWatcher(mainWindow: BrowserWindow): Promise<void> {
  try {
    await setupDBWatcher(
      ['metadata.json', 'collections.json', 'launcher.json', 'path.json', ...imageFullNames],
      mainWindow
    )
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

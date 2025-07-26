import { autoUpdater } from 'electron-updater'
import { ConfigDBManager } from '~/core/database'
import { ipcManager } from '~/core/ipc'
import log from 'electron-log/main.js'

export async function setupAutoUpdater(): Promise<void> {
  // Development Environment Configuration
  if (process.env.NODE_ENV === 'development') {
    autoUpdater.forceDevUpdateConfig = true
  }

  const allowPrerelease = await ConfigDBManager.getConfigValue('updater.allowPrerelease')
  log.info('[AppUpdater] Allow pre-release:', allowPrerelease)

  autoUpdater.allowPrerelease = allowPrerelease

  autoUpdater.autoDownload = false

  // Add error handling
  autoUpdater.on('error', (error) => {
    log.error('[AppUpdater] Update error:', error)
    ipcManager.send('updater:update-error', error.message)
  })

  // Add processing to check for the start of an update
  autoUpdater.on('checking-for-update', () => {
    log.info('[AppUpdater] Checking for updates...')
    ipcManager.send('updater:checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('[AppUpdater] Discover the new version:', info.version)
    const updateInfo = {
      version: info.version,
      releaseNotes: Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((note) => note.note).join('\n')
        : info.releaseNotes || ''
    }
    ipcManager.send('updater:update-available', updateInfo)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('[AppUpdater] Currently in the latest version:', info.version)
    ipcManager.send('updater:update-not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    ipcManager.send('updater:download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('[AppUpdater] The update has finished downloading')
    ipcManager.send('updater:update-downloaded')
  })

  // Delay checking for updates to make sure the window is fully loaded
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('[AppUpdater] Failure to automatically check for updates:', error)
    })
  }, 3000)
}

export async function updateUpdater(): Promise<void> {
  const allowPrerelease = await ConfigDBManager.getConfigValue('updater.allowPrerelease')

  autoUpdater.allowPrerelease = allowPrerelease

  log.info('[AppUpdater] Updated auto-updater settings:', { allowPrerelease })
}

// const DBVersion = {
//   pathJson: 2
// }

// export async function upgradeDBVersion(): Promise<void> {
//   const pathJsonVersion = await getDBValue('version.json', ['pathJson'], 1)
//   if (pathJsonVersion == 1) {
//     try {
//       await upgradeAllGamesPathJson1to2()
//       await setDBValue('version.json', ['pathJson'], DBVersion.pathJson)
//       log.info(`path.json Version Upgrade Successful：${pathJsonVersion} -> ${DBVersion.pathJson}`)
//     } catch (error) {
//       log.error(`path.json Version Upgrade Failure：${pathJsonVersion} -> ${DBVersion.pathJson}`, error)
//     }
//   }
// }

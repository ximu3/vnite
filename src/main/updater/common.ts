import { BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { upgradeAllGamesPathJson1to2 } from './utils'
import { getDBValue, setDBValue } from '~/database'
import log from 'electron-log/main.js'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  // Development Environment Configuration
  if (process.env.NODE_ENV === 'development') {
    autoUpdater.forceDevUpdateConfig = true
  }

  autoUpdater.autoDownload = false

  // Add error handling
  autoUpdater.on('error', (error) => {
    log.error('更新错误:', error)
    mainWindow?.webContents.send('update-error', error.message)
  })

  // Add processing to check for the start of an update
  autoUpdater.on('checking-for-update', () => {
    log.info('正在检查更新...')
    mainWindow?.webContents.send('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('发现新版本:', info.version)
    const updateInfo = {
      version: info.version,
      releaseNotes: Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((note) => note.note).join('\n')
        : info.releaseNotes || ''
    }
    mainWindow?.webContents.send('update-available', updateInfo)
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('当前已是最新版本:', info.version)
    mainWindow?.webContents.send('update-not-available')
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('更新已下载完成')
    mainWindow?.webContents.send('update-downloaded')
  })

  ipcMain.handle('start-update', async () => {
    try {
      return await autoUpdater.downloadUpdate()
    } catch (error) {
      log.error('下载更新失败:', error)
      throw error
    }
  })

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  // Add a processor for manually checking for updates
  ipcMain.handle('check-for-updates', async () => {
    try {
      return await autoUpdater.checkForUpdates()
    } catch (error) {
      log.error('检查更新失败:', error)
      throw error
    }
  })

  // Delay checking for updates to make sure the window is fully loaded
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      log.error('自动检查更新失败:', error)
    })
  }, 3000)
}

const DBVersion = {
  pathJson: 2
}

export async function upgradeDBVersion(): Promise<void> {
  const pathJsonVersion = await getDBValue('version.json', ['pathJson'], 1)
  if (pathJsonVersion == 1) {
    try {
      await upgradeAllGamesPathJson1to2()
      await setDBValue('version.json', ['pathJson'], DBVersion.pathJson)
      log.info(`path.json 版本升级成功：${pathJsonVersion} -> ${DBVersion.pathJson}`)
    } catch (error) {
      log.error(`path.json 版本升级失败：${pathJsonVersion} -> ${DBVersion.pathJson}`, error)
    }
  }
}
